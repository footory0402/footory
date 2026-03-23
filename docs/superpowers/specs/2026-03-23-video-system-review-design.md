# 영상 시스템 종합 검토 — 업로드 성능/UX + 재생 품질

> 오픈 전 영상 업로드/재생 시스템의 코드 레벨 품질 점검 및 개선 설계

## 배경

현재 영상 업로드 인프라(Presigned URL, 백그라운드 R2 업로드, FFmpeg WASM 압축, Wake Lock)는 견고하게 설계되어 있음. 이번 검토는 **사용자 체감 품질**에 초점을 맞추어, 오픈 전 반드시 보완해야 할 에러 처리/로딩 상태/재시도 UX를 개선한다.

**변경하지 않는 것들**:
- 핵심 상수 (MULTIPART_THRESHOLD=200MB, CHUNK_SIZE=5MB 등) — UPLOAD-ARCHITECTURE.md에 변경 금지 명시
- 업로드 파이프라인 구조 자체 — 이미 견고
- HLS/적응형 스트리밍 — 오픈 후 트래픽 보고 결정
- 피드 자동 재생 — 다음 단계 기능

## 작업 목록

### P0: 영상 재생 품질 보완

#### 1. ClipPlayerSheet 에러 처리
**파일**: `src/components/player/ClipPlayerSheet.tsx`

**현재 문제**: 영상 로드 실패 시 빈 검은 화면만 표시, 사용자는 원인을 알 수 없음

**개선**:
- `<video>` 태그의 `onError` 이벤트 감지
- `video.error.code`에 따라 사용자 메시지 분기:
  - `MEDIA_ERR_NETWORK` (2) → "네트워크 오류" + 재시도 가능
  - `MEDIA_ERR_DECODE` (3) → "이 영상 형식은 기기에서 지원하지 않습니다" (재시도 불필요)
  - `MEDIA_ERR_SRC_NOT_SUPPORTED` (4) → "영상을 재생할 수 없습니다"
  - 기타 → "영상을 불러올 수 없습니다"
- 에러 상태 → 비디오 숨기고 에러 UI 표시:
  ```
  ⚠️ 아이콘
  "{에러 유형별 메시지}"
  [ 다시 시도 ] 버튼 (DECODE 에러 시 숨김)
  "문제가 계속되면 영상을 다시 업로드해 주세요"
  ```
- "다시 시도" → URL에 `?t=Date.now()` cache-busting 파라미터 추가 후 `video.load()` (모바일 Safari 캐시된 실패 응답 방지)
- 3회 실패 시 "다시 업로드" 안내로 전환
- **클립 변경 시 에러 상태 + 재시도 카운터 초기화** (index 변경 useEffect에서 리셋)
- 스와이프로 다른 클립 이동은 에러 상태에서도 동작 유지

#### 2. LazyVideo 로딩/에러/버퍼링 상태
**파일**: `src/components/ui/LazyVideo.tsx`

**현재 문제**: `<video>` 태그만 렌더링, 로딩 중 빈 영역, 에러 시 무반응

**주의**: 현재 LazyVideo는 서버 컴포넌트. 이벤트 핸들러 + useState 사용을 위해 `"use client"` 디렉티브 추가 필요. 피드 카드 등 여러 곳에서 사용되므로 컴포넌트를 가볍게 유지할 것.

**개선**:
- 로딩 중: 썸네일(poster) 위에 스피너 오버레이
- 에러: 깨진 아이콘 + "재생 불가" 텍스트
- 버퍼링: 재생 중 멈추면 스피너 표시

이벤트 매핑:
| 이벤트 | 상태 |
|--------|------|
| `onLoadStart` | 로딩 |
| `onCanPlay` | 로딩 해제 |
| `onError` | 에러 |
| `onWaiting` | 버퍼링 표시 (**300ms 디바운스** — LTE에서 빠른 반복 방지) |
| `onPlaying` | 버퍼링 해제 |

#### 3. 비디오 preload 전략
**파일**: `ClipPlayerSheet.tsx`, `FeedCard.tsx`

| 위치 | preload 값 | 이유 |
|------|-----------|------|
| 피드 카드 | `"none"` (유지) | 대역폭 절약, 많은 영상 나열 |
| ClipPlayerSheet 현재 클립 | `"metadata"` | 재생 시작 속도 개선 (단, autoPlay 설정 시 브라우저가 무시할 수 있음) |
| ClipPlayerSheet 다음 클립 | `"none"` | 데이터 소모 방지 |

---

### P1: 업로드 UX 플로우 개선

#### 4. 업로드 단계별 상태 텍스트
**파일**: `src/app/upload/page.tsx`

**현재 문제**: "올리기" 버튼이 "준비 중..."으로만 표시, 압축인지 업로드인지 구분 불가

> **참고**: UPLOAD-ARCHITECTURE.md 섹션 6에 "내부 진행 상태는 숨김" 원칙이 있었으나, 이번 개선에서 해당 원칙을 업데이트한다. 사용자가 "왜 안 눌러지지?"라는 혼란을 겪는 것이 숨기는 것보다 더 큰 문제이므로, 진행 상태를 명확히 노출하는 방향으로 전환. **UPLOAD-ARCHITECTURE.md도 함께 수정할 것.**

**개선**: 올리기 버튼 하단에 조건부 상태 텍스트 + 프로그레스 바

| 단계 | 텍스트 | 프로그레스 |
|------|--------|-----------|
| 압축 엔진 로딩 | "압축 엔진 로딩 중..." | 불확정 애니메이션 |
| 압축 중 | "영상 압축 중... 45%" | 0~100% |
| R2 업로드 | "서버에 올리는 중... 30%" | 0~100% |
| 완료 | 텍스트 사라짐, 버튼 골드 활성화 | 없음 |
| 압축 미지원 | "서버에 올리는 중... 30%" | 0~100% (압축 스킵) |

데이터 소스: Zustand store의 `compressStatus`, `compressProgress`, `r2Status`, `r2Progress`

**UX 참고**: 버튼 비활성 상태에서 "서버에 올리는 중"이라는 텍스트가 혼란스러울 수 있으므로, 텍스트를 "영상 준비 중... 30%"로 통일하고, 올리기 버튼 텍스트는 "준비 중..."으로 유지. 상세 단계는 프로그레스 바 아래 작은 텍스트로 표시.

#### 5. 업로드 실패 재시도
**파일**: `src/components/upload/GlobalUploadIndicator.tsx`, `src/lib/upload-service.ts`

**현재 문제**: 에러 아이콘만 표시, 재시도 불가. 현재 에러 상태 탭 시 `/upload` 페이지로 이동하는 로직이 있음.

**개선**:
- 에러 상태의 기존 `/upload` 이동을 **"다시 시도" 버튼으로 교체** — GlobalUploadIndicator에서 직접 재시도
- 탭 → `startR2BackgroundUpload()` 재호출 (새 presigned URL 발급 → 업로드 재시작)
- 파일은 Zustand store에 이미 보관 중이므로 다시 선택 불필요
- **에러 상태에서 `reset()` 호출 방지** — 닫기 버튼은 에러 상태에서 비활성화하거나, reset 시 파일만 보존
- **재시도 카운터**: Zustand store에 `r2RetryCount` 필드 추가
- 3회 연속 실패 → "네트워크 연결을 확인해 주세요" 메시지 + `/upload`로 이동 (처음부터 다시)

---

### P2: 업로드 안정성 + 정리

#### 7. 완료 후 하이라이트 탭 이동
**파일**: `src/lib/upload-service.ts`, `src/app/profile/page.tsx`

**현재**: 무조건 `/profile`로 `router.replace` 이동
**개선**: `router.replace('/profile?tab=highlights')` — **replace 유지** (뒤로가기 시 빈 업로드 화면 방지)
- profile/page.tsx에서 `useSearchParams`로 초기 탭 결정
- 탭 전환 시 URL 쿼리 파라미터는 업데이트하지 않음 (히스토리 오염 방지, 간단한 구현)

#### 8. 앱 이탈 감지 + 자동 재시도
**파일**: `src/lib/upload-service.ts`

**현재 문제**: 카톡 확인하러 나갔다 돌아오면 XHR이 중단되었을 수 있는데 피드백 없음

**범위**: 단일 PUT 업로드만 해당 (멀티파트는 threshold 200MB로 사실상 비활성)

**개선**:
- `visibilitychange` 이벤트 리스너를 `startR2BackgroundUpload()` 함수 내부에서 등록, 업로드 완료/실패 시 해제
- `lastProgressTime`을 Zustand store에 저장 (클로저 변수에서 승격 — visibilitychange 핸들러에서 접근 필요)
- 복귀 시 마지막 progress 업데이트 시각 확인:
  - 30초 미만 → 아직 진행 중, 아무것도 안 함
  - 30초 이상 → "멈춤" 판단
- **자동 재시도 전에 기존 XHR을 명시적으로 abort** → 새 presigned URL 발급 → 업로드 재시작
- 이때 `bgUploadGeneration` 증가로 구 XHR 결과 무시 (기존 메커니즘 활용)
- 사용자에게 "업로드 재시작 중..." 표시

#### 9. 구버전 feed_items 호환 코드 정리
**파일**: `src/components/feed/FeedList.tsx`

**현재**: `video_url` 없는 구버전 feed_items에서 `/api/clips/{id}` 추가 호출
**개선**: 오픈 전이므로 구버전 데이터 없음 → FeedList의 호환 fetch 코드만 제거 (API 엔드포인트 `/api/clips/[id]`는 다른 곳에서 사용하므로 유지)

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/player/ClipPlayerSheet.tsx` | 에러 UI (MediaError 코드 분기, cache-busting, 카운터 리셋) + preload |
| `src/components/ui/LazyVideo.tsx` | `"use client"` 전환 + 로딩/에러/버퍼링 상태 (waiting 디바운스) |
| `src/app/upload/page.tsx` | 단계별 상태 텍스트 + 프로그레스 바 |
| `src/components/upload/GlobalUploadIndicator.tsx` | 에러 시 `/upload` 이동 → 직접 재시도 버튼 교체 |
| `src/lib/upload-service.ts` | 재시도 로직 + 이탈 감지 (lastProgressTime store 승격, XHR abort) + 완료 경로 |
| `src/stores/upload-store.ts` | `r2RetryCount`, `lastProgressTime` 필드 추가 |
| `src/app/profile/page.tsx` | useSearchParams로 초기 탭 결정 |
| `src/components/feed/FeedList.tsx` | 구버전 호환 코드 제거 |
| `docs/UPLOAD-ARCHITECTURE.md` | 섹션 6 "내부 진행 상태 숨김" 원칙 업데이트 |

## 향후 계획 (이번 스코프 밖)

- 피드 자동 재생 (IntersectionObserver 기반)
- 썸네일 수동 선택 기능
- 적응형 스트리밍 (HLS/DASH) — 트래픽 규모 확인 후
- "나를 표시하는 하이라이트" (선수 인식 마커/편집 기능)
- 에러 모니터링/로깅 (Sentry 등) — 오픈 초기 필수
