# 영상 업로드 단순화 + 효과 미반영 버그 수정

> 날짜: 2026-03-21
> 상태: 승인됨

## 문제 정의

1. **효과 미반영**: 업로드는 되지만 색보정/시네마틱바/인트로 등 효과가 최종 영상에 적용되지 않음
2. **UX 혼란**: 꾸미기 단계가 4탭(나찾기/슬로모/효과/BGM)으로 구성되어 뭘 해야 하는지 직관적이지 않음

## 결정 사항

- **유지**: 트림(구간 자르기), 나 찾기(Spotlight), 효과(색보정/시네마틱바/EA FC카드/인트로)
- **제거**: 슬로모(느린 재생), BGM

---

## 1. 업로드 흐름 변경 (4단계 → 2단계)

### 현재

```
Step 0: 파일 선택
Step 1: 트림 (구간 자르기)
Step 2: 꾸미기 (4탭: 나찾기 / 슬로모 / 효과 / BGM)
Step 3: 태그 + 메모 + 업로드
```

### 변경

```
Step 1: 영상 선택 + 트림
Step 2: 나 찾기 → 효과 토글 → 태그/메모 → 업로드
```

### Step 1 상세

- 영상을 선택하면 바로 트리머가 나타남
- VideoSelector → VideoTrimmer를 같은 step에서 순차 표시
- 트림 완료 후 "다음" 버튼

### Step 2 상세 (위에서 아래 순서)

1. **나 찾기** — 트림 시작점 프레임에서 터치로 내 위치 선택 (SpotlightPicker에 `trimStart` prop 전달, `video.currentTime = trimStart`로 변경)
2. **효과 토글** — 색보정 / 시네마틱바 / EA FC카드 / 인트로 (4개 스위치, EffectsToggle 재활용)
3. **태그/메모** — 스킬 태그(최대 3개) + 스킬 라벨 + 메모 (TagMemoForm 재활용)
4. **업로드 버튼** — 골드 CTA

---

## 2. 렌더 파이프라인 경량화 (7패스 → 4패스)

### 현재 6패스 (코드 기준 — BGM은 clip.ts에서 미호출)

```
Pass 1: 색보정 + 스케일 + 레터박스
Pass 2: 텍스트 오버레이 (EA FC 카드)
Pass 3: 골드 링 (스포트라이트)
Pass 4: 슬로모 리플레이
Pass 5: 인트로 카드
Pass 6: concat (인트로 + 메인 + 슬로모)
(BGM: clip.ts에서 호출하지 않음 — highlight.ts에서만 사용)
```

### 변경 4패스

```
Pass 1: 색보정 + 스케일 + 레터박스 (트림 포함)
Pass 2: 텍스트 오버레이 (EA FC 카드 — 이름/등번호/포지션)
Pass 3: 골드 링 / 스포트라이트 (나 찾기 좌표 기반)
Pass 4: 인트로 카드 생성 + concat (인트로 + 메인)
```

### 인트로 없이 업로드 시

- Pass 4 스킵, Pass 3 결과가 최종 출력
- 실질적으로 3패스만 실행

---

## 3. 파일 변경 목록

### 삭제 (7개)

| 파일 | 이유 |
|------|------|
| `src/components/video/SlowmoPicker.tsx` | 슬로모 제거 |
| `src/components/video/BgmPicker.tsx` | BGM 제거 |
| `src/hooks/useAudioPreview.ts` | BGM 미리듣기 제거 |
| `render-worker/src/container/pipeline/slowmo.ts` | 슬로모 패스 제거 |
| `render-worker/src/container/pipeline/bgm.ts` | BGM 패스 제거 |

### 수정 (추가)

| 파일 | 변경 내용 |
|------|----------|
| `render-worker/src/container/pipeline/highlight.ts` | `bgm.ts` import 및 `passBgm`/`downloadBgm` 호출 제거 (하이라이트 릴에서도 BGM 제거) |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `src/app/(main)/upload/page.tsx` | 4단계 → 2단계 흐름 재구성 |
| `src/stores/upload-store.ts` | 필드 제거: `slowmoStart`, `slowmoEnd`, `slowmoSpeed`, `bgmId`. setter 제거: `setSlowmo`, `setBgmId`. spotlight/effects 유지 |
| `src/lib/upload-service.ts` | 렌더 params에서 slowmo/bgm 제거 + clipPayload에서 `slowmo_start`, `slowmo_end`, `slowmo_speed`, `bgm_id` 필드 제거 + 효과 전달 버그 수정 |
| `render-worker/src/container/pipeline/clip.ts` | 7패스 → 4패스로 축소 |
| `src/app/api/render/route.ts` | params 정규화에서 slowmo/bgm 제거 |
| `src/lib/render-api.ts` | RenderRequest 타입 간소화 |

### 유지 (변경 없음)

| 파일 | 이유 |
|------|------|
| `src/components/upload/VideoSelector.tsx` | 파일 선택 — 안정적 |
| `src/components/video/VideoTrimmer.tsx` | 트림 — 안정적 |
| `src/components/video/SpotlightPicker.tsx` | 나 찾기 — 유지 (단, `trimStart` prop 추가 수정 필요) |
| `src/components/video/EffectsToggle.tsx` | 효과 토글 — 재활용 |
| `src/components/upload/TagMemoForm.tsx` | 태그/메모 — 재활용 |
| `src/components/upload/UploadComplete.tsx` | 완료 화면 — 유지 |
| `src/components/upload/ChildSelector.tsx` | 부모 모드 — 유지 |
| `src/app/api/upload/presign/route.ts` | 업로드 인프라 — 안정적 |
| `src/app/api/upload/multipart/route.ts` | 업로드 인프라 — 안정적 |
| `render-worker/src/container/pipeline/color.ts` | 색보정 패스 — 유지 |
| `render-worker/src/container/pipeline/text.ts` | 텍스트 패스 — 유지 |
| `render-worker/src/container/pipeline/intro.ts` | 인트로 패스 — 유지 |
| `render-worker/src/container/pipeline/ring.ts` | 링/스포트라이트 패스 — 유지 |
| `render-worker/src/container/pipeline/concat.ts` | concat — 유지 |

---

## 4. 효과 미반영 버그 — 디버깅 전략

Worker는 정상 동작 확인됨 (`/health` → 200, `/render` → 400 정상 응답).
Cloudflare Container + FFmpeg 파이프라인도 코드상 존재.

### 가능한 원인 3가지

**원인 1: params 전달 누락**
- `upload-service.ts`의 `startRenderUpload`에서 `/api/render` 호출 시 `effects` 객체가 빠지거나 잘못된 형태로 전달
- 확인: 렌더 요청 body를 로그로 찍어서 effects 값 확인

**원인 2: Container 시작 실패**
- Cloudflare Container(Docker + FFmpeg)가 cold start에 실패하거나 타임아웃
- Worker는 응답했지만 Container 내부 Express 서버가 실제 렌더를 못 함
- 확인: Worker 로그에서 `[RenderContainer] Started` 메시지 존재 여부

**원인 3: Fallback 경로 동작**
- `render/route.ts` 76-88줄: `RENDER_WORKER_URL` 미설정 시 원본을 그대로 "done" 처리
- Vercel 배포 환경에서 환경변수가 빠져있으면 효과 없이 원본이 저장됨
- 확인: Vercel 대시보드에서 `RENDER_WORKER_URL` 환경변수 설정 여부

### 디버깅 순서

```
1. Vercel 환경변수 확인 (RENDER_WORKER_URL 존재?)
2. 존재 → upload-service.ts에서 /api/render 호출 시 params 로깅 추가
3. params 정상 → Container 내부 FFmpeg 실행 로그 확인 (wrangler tail)
4. 원인 특정 → 수정
```

---

## 5. 예상 결과

| 지표 | 현재 | 변경 후 |
|------|------|---------|
| 업로드 단계 | 4단계 | 2단계 |
| 꾸미기 탭 | 4개 | 0개 (단일 스크롤) |
| 렌더 패스 | 6개 | 4개 (인트로 없으면 3개) |
| 삭제 파일 | — | 5개 |
| 삭제 코드량 | — | ~800줄 추정 |
| 효과 적용 | 안 됨 | 버그 수정 후 정상 동작 |
