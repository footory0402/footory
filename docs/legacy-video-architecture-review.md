# 기존 영상 아키텍처 보존 검토

## 문서 목적
- Prompt C 전에 기존 Footory 저장소에 이미 존재하던 영상 아키텍처와 문서를 실제 코드 기준으로 보존 판정한다.
- 이번 문서는 삭제 결정을 내리기 위한 문서가 아니라, 무엇을 유지 축으로 보고 무엇을 새 기준 문서에 흡수하거나 보류할지 정리하는 문서다.

## 1. 기존 영상 아키텍처 요약

### 현재 확인된 메인 흐름
- 현재 일반 업로드 메인 경로는 `/upload`다.
- 실제 페이지 흐름은 `SelectView -> UploadProcessingView -> HighlightSuggestionReview`다.
- 원본 저장은 `src/lib/upload-service.ts`, `/api/upload/presign`, `/api/upload/direct`, `/api/upload/multipart`를 통해 Cloudflare R2로 들어간다.
- 업로드 완료 후 `POST /api/clips`가 `clips.video_url`, `thumbnail_url`, `highlight_start`, `highlight_end` 등 메타데이터를 저장한다.
- 그 다음 검토 화면은 `src/lib/highlight-suggestion.ts`가 클라이언트에서 만든 드래프트를 메모리 상태에 올리고, 저장 시 `PATCH /api/clips/[id]`와 `POST /api/featured` 또는 `clip_tags` 갱신으로 닫는다.

### 현재 확인된 재생 구조
- 실제 재생은 별도 렌더 결과물을 반드시 요구하지 않는다.
- `ClipPlayerSheet`, `HighlightSharePlayerClient`, `ReelShareClient`가 `clips` 행에 저장된 `trim_start`, `trim_end`, `spotlight_x`, `spotlight_y`, `freeze_at`, `effects`를 읽어 런타임 오버레이와 줌으로 재생한다.
- 즉 현재 제품의 실제 재생 아키텍처는 "원본 또는 저장된 clip URL + 메타데이터 기반 클라이언트 조합"이다.

### 현재 확인된 주변 구조
- `/api/render/*`, `render-worker/`, `render_jobs`, `raw_key`, `rendered_url`는 살아 있다.
- 하지만 현재 `/upload` 메인 경로는 이 서버 렌더 파이프라인을 기본 경로로 사용하지 않는다.
- `ParentQuickUpload`는 별도 UI를 유지하지만 최종 저장 계약은 같은 `clips` 테이블과 R2 공개 URL을 사용한다.

## 2. Cloudflare R2 원본 저장 구조가 현재도 유효한지

### 판정
- 유지해야 한다.

### 근거
- 현재 업로드 API와 서비스가 모두 R2를 전제로 동작한다.
- `src/lib/r2.ts`는 `originals/{userId}/{clipId}.{ext}`와 `thumbnails/{userId}/{clipId}.jpg` 키를 기준으로 presigned URL을 발급한다.
- `src/app/api/upload/direct/route.ts`와 `src/app/api/upload/multipart/route.ts`도 허용 키를 `originals/`, `thumbnails/`, `raw/`로 제한한다.
- `src/lib/r2-client.ts`와 `getPublicVideoUrl()`이 공개 재생 URL 조합의 실제 기준이다.
- 부모 업로드, 일반 업로드, 렌더 워커 모두 R2를 공통 저장소로 사용한다.

### 주의할 점
- 기존 `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`는 일반 업로드의 기본을 "파일 선택 즉시 백그라운드 업로드"로 설명하지만, 현재 `/upload` 메인 경로는 `업로드 시작` 버튼 후 처리 단계에서 실제 업로드를 시작한다.
- 기존 문서의 `MULTIPART_THRESHOLD = 200MB` 설명도 실제 코드의 `50MB`와 다르다.
- 기존 문서의 `thumbnails/{userId}/{clipId}_thumb.jpg`, `highlights/` 기본 결과물 설명도 현재 key 계약과 맞지 않는다.
- 즉 R2 자체는 유효하지만, R2 사용 방식 설명은 현행 코드 기준으로 다시 흡수해야 한다.

## 3. 원본 저장 + 편집 데이터 기반 클라이언트 재생 구조가 현재도 유효한지

### 판정
- 핵심 구조로 유지해야 한다.
- 다만 "편집 프로젝트 분리 저장"까지는 아직 유효한 구현이 아니다.

### 현재 유효한 부분
- `clips` 행에 저장된 trim, spotlight, freeze, effects 메타데이터를 클라이언트 플레이어가 직접 소비한다.
- `ClipPlayerSheet`, `HighlightSharePlayerClient`, `ReelShareClient`는 같은 재생 계약을 공유한다.
- 이 구조 덕분에 별도 서버 렌더 없이도 프로필, 공유 페이지, 릴에서 같은 영상을 재생할 수 있다.
- 현재 저장 플로우도 `PATCH /api/clips/[id]`로 `highlight_start`, `highlight_end`, `trim_start`, `trim_end`, `duration_sec`를 갱신하는 방식이라 이 재생 구조와 직접 연결된다.

### 아직 유효하지 않은 부분
- `docs/media-pipeline.md`가 전제한 `원본 저장 -> 분석 결과 저장 -> 편집 프로젝트 저장 -> 최종 렌더 저장 -> 프로필 연결` 전체 체계는 아직 구현되지 않았다.
- 자동 하이라이트 드래프트는 `HighlightSuggestionDraft` 형태로 클라이언트 메모리에만 존재한다.
- 재진입 복구, 서버 저장된 draft project, 별도 결과물 엔티티는 없다.

### 결론
- Prompt C 전에 버리면 안 되는 것은 "클립 메타데이터 기반 런타임 재생"이다.
- 반대로 "편집 프로젝트 분리 저장"은 현재 기준에서 아직 목표 문서 쪽 요소다. 유지 대상이 아니라 흡수 대상이다.

## 4. 주인공 타겟팅 기능의 현재 상태와 우선순위

### 현재 상태
- 데이터 모델은 살아 있다.
  - `clips.spotlight_x`, `clips.spotlight_y`, `clips.freeze_at`
  - `effects.trackingMode`, `effects.trackingPoints`, `effects.focusZoom`
- 재생 소비 경로도 살아 있다.
  - `VideoOverlay`
  - `ClipPlayerSheet`
  - `HighlightSharePlayerClient`
  - `ReelShareClient`
  - `playback-focus`, `useSpotlightZoom`
- 작성 UI는 메인 경로에서 밀려 있다.
  - `DecorateView`는 현재 `/upload` 메인 phase에서 빠졌다.
  - `SpotlightSetupView`, `SpotlightOverlay` 같은 구형 편집 UI도 남아 있다.

### 우선순위 판정
- 우선순위는 "작성 UX"보다 "재생 계약 보존"이 높다.
- 주인공 타겟팅은 Footory의 선수 어필 구조와 직접 연결되므로 완전히 버릴 대상이 아니다.
- 다만 현재 Prompt C 직전 기준에서 메인 업로드 경험의 1순위는 자동 제안 검토와 저장 흐름이고, 주인공 타겟팅 입력 UI는 phase 2로 미루는 편이 맞다.

### 이유
- 제품 DNA상 주인공 식별은 유지 가치가 높다.
- 실제 코드상 이미 소비 경로가 많아서 성급히 제거하면 프로필 재생, 공유 재생, 릴 재생이 모두 약해진다.
- 반면 작성 UI는 현재 메인 경로 밖에 있어도 제품 전체를 막지는 않는다.

## 5. 유지해야 할 요소

- Cloudflare R2 원본 저장과 썸네일 저장 구조.
- `clips` 메타데이터를 기반으로 프로필, 공유, 릴이 같은 방식으로 재생되는 클라이언트 조합 구조.
- `highlight_start`, `highlight_end`, `trim_start`, `trim_end`, `duration_sec`를 중심으로 한 현재 clip 저장 계약.
- `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.trackingMode`, `effects.trackingPoints`, `effects.focusZoom` 같은 주인공 타겟팅 메타데이터와 재생 소비 경로.
- 저장 결과를 `featured_clips` 또는 `clip_tags`로 연결하는 현재 프로필 반영 구조.

## 6. 새 문서에 흡수할 요소

- `docs/archive/2026-04-10/ARCHITECTURE.md`의 R2 버킷 개념과 `clips`, `featured_clips`, `highlights`, `render_jobs` 스키마 설명.
  - 흡수 대상: `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md`
- `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`의 presigned URL, direct upload fallback, multipart 제약, R2 키 체계 설명.
  - 흡수 대상: `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md`
- `docs/app-overview.md`의 업로드/재생/부모 업로드 경로 설명.
  - 흡수 대상: `docs/repo-audit.md`, 이후 갱신될 현재 상태 문서
- `docs/implementation-gap.md`의 "현재 구현은 clip 메타데이터 직접 수정, 서버 저장 draft 없음"이라는 차이 기록.
  - 흡수 대상: `docs/media-pipeline.md`, Prompt C 판단 메모

### 이번 라운드 흡수 완료 메모
- `docs/media-pipeline.md`에 현재 R2 key 규칙(`originals/`, `thumbnails/`, `raw/`)과 presign/public URL 운영 규칙을 반영했다.
- 같은 문서에 multipart 50MB 임계값, 5MB 최소 파트 크기, direct-upload fallback 유지 이유를 반영했다.
- 따라서 `docs/archive/2026-04-10/ARCHITECTURE.md`, `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`에서 core 판단에 필요한 기술 메모는 대부분 기준 문서로 옮겼다.

## 7. phase 2로 보류할 요소

- `/api/render/*`, `render-worker/`, `render_jobs`, `raw_key`, `rendered_url` 중심 서버 렌더 파이프라인.
  - 코드와 스키마는 살아 있지만 현재 메인 `/upload` 경로의 기본값은 아니다.
- `DecorateView`, `SpotlightSetupView` 같은 주인공 타겟팅 입력 UI의 재정렬.
  - 재생 계약은 유지하되, 작성 UX는 Prompt C 이후 재배치 판단이 필요하다.
- 편집 드래프트 영속 저장, 재진입 복구, 별도 결과물 엔티티.
  - 현재 문서상 목표이지만 구현은 아직 없다.
- 부모 업로드와 일반 업로드의 UI 통합.
  - 저장 계약은 비슷하지만 진입 UX와 서비스 함수가 아직 분리돼 있다.

## 8. 폐기 또는 아카이브할 요소

- 일반 업로드 메인 구조를 `VideoSelector -> 태그/메모 -> 올리기` 또는 `SelectView -> DecorateView -> DoneView`로 설명하는 기존 문서 서술.
- `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md` 안의 "파일 선택 즉시 백그라운드 업로드가 일반 업로드의 기본"이라는 설명.
- `docs/archive/2026-04-10/ARCHITECTURE.md` 안의 `highlight_url` 중심 설명과 실제 코드에 없는 단일 canonical 파이프라인 서술.
- `docs/archive/2026-04-10/PROGRESS.md` 안의 구형 영상 위저드와 효과 토글 중심 완료 서술.
- 서버 렌더 파이프라인을 현재 제품의 유일한 기준 아키텍처처럼 읽히게 만드는 설명.

### archive 판정
- `docs/archive/2026-04-10/ARCHITECTURE.md`는 merge 후 archive 완료 상태다.
- `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`도 merge 후 archive 완료 상태다.
- 두 문서는 역사 기록과 과거 제약 추적에는 가치가 있지만, 더 이상 직접 기준본으로 읽히면 안 된다.

## 최종 판정 요약
- 현재 반드시 보존해야 하는 기존 핵심은 `R2 원본 저장`, `clip 메타데이터 기반 클라이언트 재생`, `주인공 타겟팅 메타데이터`, `프로필 연결 구조`다.
- 새 기준 문서에 흡수해야 하는 것은 기존 아키텍처 문서의 저장소 키 규칙, API 제약, 스키마 설명이다.
- phase 2로 미룰 것은 서버 렌더 파이프라인 재가동 여부와 주인공 타겟팅 작성 UX 재편이다.
- 바로 버릴 대상은 코드 자체보다 낡은 설명과 메인 경로로서의 지위를 잃은 문서 서술이다.
