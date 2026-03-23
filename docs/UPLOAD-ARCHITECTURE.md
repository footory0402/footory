# 영상 업로드 아키텍처

> 최종 업데이트: 2026-03-23
> 이 문서는 실제 구현 기반으로 작성됨. 이전 실수와 트레이드오프 포함.

---

## 1. 전체 플로우

```
파일 선택 (VideoSelector)
    │
    ├─ [압축 지원 + 5MB 이상] FFmpeg WASM 압축 시작 (백그라운드)
    │       └─ 압축 완료 → compressedFile 저장 → R2 백그라운드 업로드 시작
    │
    └─ [압축 미지원 또는 5MB 미만] 즉시 R2 백그라운드 업로드 시작

R2 백그라운드 업로드 (startR2BackgroundUpload)
    │
    ├─ GET /api/upload/presign → presigned PUT URL 발급 (유효 1시간)
    ├─ XHR PUT → 브라우저 → R2 직접 전송 (Vercel 함수 미통과)
    └─ r2Status: idle → uploading → done/error

사용자: 태그 + 메모 입력, "올리기" 탭
    │
    └─ startUpload()
            │
            ├─ r2Status === "done" → DB 저장만 (즉시)
            ├─ r2Status === "uploading" → R2 완료 대기 후 DB 저장
            └─ r2Status === "error" → presigned URL로 재업로드 후 DB 저장

    DB 저장 (POST /api/clips)
    └─ 150ms 후 /profile 이동

GlobalUploadIndicator: 백그라운드에서 진행 상태 표시
```

---

## 2. 핵심 상수 (upload-service.ts)

```ts
const MULTIPART_THRESHOLD = 200 * 1024 * 1024; // 200MB — 사실상 비활성화
const CHUNK_SIZE = 5 * 1024 * 1024;             // 5MB — R2 최소 파트 크기
const CONCURRENT_PARTS = 3;
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;       // 10분
const API_TIMEOUT_MS = 60_000;                  // API 호출 60초
const MAX_DIRECT_RETRIES = 3;
```

### MULTIPART_THRESHOLD를 200MB로 설정한 이유 (절대 낮추지 말 것)

**배경**: 초기 구현은 10MB 이상 파일을 멀티파트 업로드로 처리했음.

**문제**: Vercel Hobby 플랜은 **모든 함수에 10초 하드캡**이 있음.
- `vercel.json`의 `maxDuration: 300` 설정을 완전히 무시함
- `export const maxDuration = 300` 코드 설정도 무시됨
- `ListParts + CompleteMultipartUpload` API 호출이 10초를 초과 → 항상 504 타임아웃
- 결과: 업로드가 94%에서 항상 멈춤

**해결**: 단일 presigned PUT 사용. 브라우저 → R2 직접 전송이라 Vercel 함수를 통과하지 않음. R2는 단일 PUT으로 최대 5GB까지 지원.

> ⚠️ **Pro 플랜으로 업그레이드해도 MULTIPART_THRESHOLD를 낮추기 전에 반드시 검증할 것.**
> 멀티파트는 `CompleteMultipartUpload` 호출이 Vercel 함수를 통과하므로 여전히 위험.

### CHUNK_SIZE를 5MB 미만으로 절대 내리지 말 것

R2(S3 호환)는 **마지막 파트를 제외한 모든 파트가 최소 5MB** 이상이어야 함.
2MB로 낮추면 `CompleteMultipartUpload` 시 `EntityTooSmall` 에러 발생.

---

## 3. Presigned URL 설정

```ts
// src/lib/r2.ts
const url = await getSignedUrl(client, command, { expiresIn: 3600 }); // 1시간
```

- **1시간으로 설정한 이유**: LTE 환경에서 대용량 파일 업로드 시 URL이 만료될 수 있음. 기존 10분은 너무 짧았음.
- **ContentLength 서명 제외**: 모바일 브라우저에서 실제 전송 Content-Length와 서명된 값이 불일치하면 R2가 거부함. PutObjectCommand에 ContentLength 포함하지 말 것.

---

## 4. FFmpeg WASM 압축

| 조건 | 동작 |
|------|------|
| 압축 미지원 브라우저 (iOS Safari 일부) | 건너뜀, 원본 바로 업로드 |
| 5MB 미만 소용량 | 건너뜀 (압축 효과 미미) |
| 5MB 이상 + 지원 브라우저 | 백그라운드 압축 후 업로드 |
| 압축 실패 | 원본으로 폴백 |

```ts
// src/components/upload/VideoSelector.tsx
if (!isCompressionSupported() || selected.size < 5 * 1024 * 1024) {
  useUploadStore.getState().setCompressStatus("skipped");
  startR2BackgroundUpload();
  return;
}
```

`compressedFile`이 있으면 `startR2BackgroundUpload` / `startUpload` 모두 원본 대신 압축본 사용.

---

## 5. Wake Lock (화면 꺼짐 방지)

```ts
// upload-service.ts
async function acquireWakeLock() {
  if ("wakeLock" in navigator) {
    wakeLock = await navigator.wakeLock.request("screen");
  }
}
function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}
```

- R2 백그라운드 업로드 시작 시 Wake Lock 획득
- 업로드 완료/실패 시 해제
- 지원하지 않는 브라우저는 무시 (try-catch)
- **한계**: 앱을 완전히 닫거나 백그라운드로 전환하면 웹에서는 중단됨 (네이티브 앱과 다름). 파일 선택 즉시 백그라운드 업로드를 시작하는 이유 중 하나.

---

## 6. UX 플로우 설계 원칙

**인스타그램 스타일**: 파일 선택 즉시 백그라운드 업로드 시작 → 사용자는 태그/메모 입력하는 동안 업로드 진행 → "올리기" 탭하면 즉시 이동.

**버튼 상태**:
| 상태 | 버튼 모양 |
|------|---------|
| 압축 중 / R2 업로드 중 | 회색 비활성 + 스피너 + "준비 중..." |
| R2 완료 / 에러 (재업로드 가능) | 골드 활성 + "올리기" |
| 올리기 탭한 후 | 회색 비활성 + "업로드 중..." |

**내부 진행 상태 노출**: 올리기 버튼 하단에 단계별 상태 텍스트 + 프로그레스 바 표시. "준비 중..." 버튼만으로는 사용자가 "왜 안 눌러지지?"라는 혼란을 겪을 수 있으므로, 압축/업로드 진행 상태를 명확히 노출. (2026-03-23 원칙 변경)

---

## 7. Service Worker 우회

```ts
async function fetchBypassSW(input, init) {
  return fetch(input, { ...init, cache: "no-store" });
}
```

모바일에서 Service Worker(PWA)가 POST/PUT 요청을 가로채면 "Failed to fetch" 발생. `cache: "no-store"` 옵션으로 우회.

---

## 8. vercel.json 함수 설정 주의사항

```json
{
  "functions": {
    "src/app/api/upload/multipart/route.ts": { "maxDuration": 300 },
    "src/app/api/upload/direct/route.ts": { "maxDuration": 120 },
    "src/app/api/**/*.ts": { "maxDuration": 15 }
  }
}
```

- 와일드카드(`**`)가 더 구체적인 경로를 덮어쓸 수 있음 → **구체적인 경로를 먼저 선언할 것**
- Hobby 플랜에서는 어떤 설정이든 10초 하드캡이 적용됨 — `maxDuration: 300`은 Hobby에서 무의미
- 실제 업로드 함수(`/api/upload/direct`)는 Vercel 함수를 통과하지 않으므로 이 설정은 메타데이터 API용

---

## 9. 관련 파일

| 파일 | 역할 |
|------|------|
| `src/lib/upload-service.ts` | 업로드 오케스트레이션 (presign, R2 PUT, DB 저장) |
| `src/lib/r2.ts` | R2 presigned URL 생성 (서버 전용) |
| `src/lib/r2-client.ts` | R2 SDK 클라이언트 |
| `src/lib/video-compressor.ts` | FFmpeg WASM 압축 |
| `src/stores/upload-store.ts` | Zustand 업로드 상태 |
| `src/components/upload/VideoSelector.tsx` | 파일 선택 + 압축 트리거 |
| `src/components/upload/GlobalUploadIndicator.tsx` | 전역 업로드 진행 표시 |
| `src/app/upload/page.tsx` | 업로드 페이지 (태그/메모/올리기) |
| `src/app/api/upload/presign/route.ts` | presigned URL 발급 API |
| `src/app/api/upload/direct/route.ts` | 서버 프록시 업로드 (소용량 폴백) |
| `src/app/api/clips/route.ts` | DB 메타데이터 저장 |

---

## 10. 과거 실수 & 절대 하지 말 것

| 실수 | 결과 | 올바른 방법 |
|------|------|------------|
| CHUNK_SIZE를 2MB로 낮춤 | R2 `EntityTooSmall` 에러, CompleteMultipartUpload 실패 | **5MB 이상 유지** |
| MULTIPART_THRESHOLD를 낮게 설정 | Vercel 10초 타임아웃으로 94% 멈춤 | **200MB 이상 유지 (사실상 비활성화)** |
| PutObjectCommand에 ContentLength 추가 | 모바일 브라우저 Content-Length 불일치로 R2 거부 | ContentLength 서명 제외 |
| presigned URL 유효기간 10분 | LTE 환경 대용량 파일 업로드 시 만료 | **1시간(3600초)** |
| vercel.json 와일드카드만 선언 | 구체적 경로 maxDuration 무시됨 | 구체적 경로 먼저 선언 |
