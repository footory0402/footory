# Footory 구현-문서 갭 정리

## 문서 목적
- 이 문서는 현재 워크트리에서 Prompt 5, 6 산출로 보이는 업로드/하이라이트 변경이 어떤 문서와 어긋나는지 정리한다.
- 판단 기준은 실제 수정 파일, 실제 라우트, 실제 저장 경로, 현재 테스트 코드다.
- 이번 단계에서는 지우기보다 보류 기준을 먼저 남긴다.

## 분석 대상

### 현재 워크트리 변경 중 업로드/하이라이트 관련 파일
- 수정됨
  `src/app/upload/page.tsx`
  `src/components/upload/SelectView.tsx`
  `src/components/upload/GlobalUploadIndicator.tsx`
  `src/stores/upload-store.ts`
  `src/app/api/clips/[id]/route.ts`
  `tests/e2e/video/video-upload-flow.spec.ts`
  `src/__tests__/upload-store.test.ts`
- 새로 추가됨
  `src/components/upload/UploadProcessingView.tsx`
  `src/components/upload/HighlightSuggestionReview.tsx`
  `src/lib/highlight-suggestion.ts`
  `src/lib/highlight-save.ts`
  `src/__tests__/highlight-suggestion.test.ts`
  `src/__tests__/upload-service.test.ts`
  `src/__tests__/upload-editor-regression.test.tsx`

## Prompt 5, 6 코드와 문서가 어긋나는 지점

| 코드 | 현재 동작 | 어긋나는 문서 | 차이 |
| --- | --- | --- | --- |
| `src/app/upload/page.tsx` | 메인 업로드 흐름이 `select -> processing -> review`로 바뀌었다. `DecorateView`, `DoneView`는 메인 경로에서 빠졌다. | `docs/app-overview.md`, `docs/repo-audit.md`, `docs/archive/2026-04-10/subagents.md`, `CLAUDE.md` | 문서는 여전히 `SelectView -> DecorateView -> DoneView` 또는 2단계 꾸미기 위저드 기준으로 설명한다. |
| `src/components/upload/SelectView.tsx` | 버튼 라벨을 바꿀 수 있고, 파일 선택 직후 백그라운드 업로드를 시작하지 않을 수도 있다. 현재 `/upload`에서는 `업로드 시작` 버튼을 누른 뒤 처리 단계로 넘어간다. | `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`, `docs/app-overview.md` | archived 문서는 파일 선택 직후 곧바로 백그라운드 업로드가 시작된다고 설명한다. |
| `src/components/upload/UploadProcessingView.tsx`, `src/components/upload/GlobalUploadIndicator.tsx` | `analyzing` 상태와 단계형 처리 화면이 추가됐다. | `docs/app-overview.md`, `docs/repo-audit.md` | 현재 문서에는 처리 화면과 기본 하이라이트 제안 생성 단계가 아직 반영되지 않았다. |
| `src/components/upload/HighlightSuggestionReview.tsx`, `src/lib/highlight-suggestion.ts` | 업로드 직후 기본 컷 제안, 대표 컷 선택, 컷 순서 이동, 시작/끝 미세 조정, 저장 준비 UI가 생겼다. | `docs/testing/video-highlight-acceptance.md`, `docs/testing/playwright-scenarios.md`, `docs/repo-audit.md` | 세 문서의 "현재 구현에는 아직 없다"는 설명 일부가 더 이상 맞지 않는다. |
| `src/lib/highlight-save.ts`, `src/app/api/clips/[id]/route.ts` | 저장 시 기존 `clips` 레코드에 `highlight_start`, `highlight_end`, `trim_start`, `trim_end`, `duration_sec`를 직접 반영하고, 필요하면 `featured_clips` 또는 `clip_tags`를 갱신한다. | `docs/media-pipeline.md`, `docs/video-upload-editing-spec.md` | 문서는 원본, 편집 프로젝트, 최종 결과물을 분리해 저장하는 방향인데 현재 구현은 기존 클립 메타데이터를 직접 수정한다. |
| `tests/e2e/video/video-upload-flow.spec.ts` | 현재 UI 기준의 4개 시나리오로 축소되었고, 실제 파일 업로드를 사용한다. | `docs/testing/playwright-scenarios.md` | 문서가 요구한 실패, 지연, 재진입 복구, 저장 후 프로필 반영, 작은 화면 시나리오가 아직 코드화되지 않았다. |

## 과도하게 구현된 부분

### 1. 저장 모델보다 UI 슬라이스가 먼저 넓어졌다
- `HighlightSuggestionReview` 한 컴포넌트 안에 검토, 미세 조정, 저장 연결, 저장 완료가 모두 들어왔다.
- 현재 데이터 모델과 복구 모델이 정리되기 전에 화면 단계가 먼저 커졌다.

### 2. 드래프트 없이 라이브 클립을 바로 수정한다
- `saveHighlightDraft()`는 별도 편집 프로젝트를 저장하지 않고 기존 `clips` 행을 즉시 수정한다.
- 이 방식은 빠르지만, 문서가 전제로 둔 `analysis -> draft -> rendered output -> profile link` 구조보다 앞서 나갔다.

### 3. 프로필 연결 분기까지 이미 들어왔다
- 현재 저장 단계는 `featured_candidate`와 `tag_portfolio`를 모두 다룬다.
- 반면 관련 문서와 테스트는 아직 "현재 구현 기준"과 "다음 MVP 기준"을 명확히 분리해 적지 못했다.

## 아직 없는 핵심 부분

### 1. 자동 분석의 영속 저장
- 현재 기본 제안은 `createHighlightSuggestionDraft()`가 업로드 완료 후 클라이언트에서 즉시 만든다.
- 제안 결과를 서버에 저장하거나 다시 불러오는 경로는 없다.

### 2. 재진입 복구와 임시 저장
- `highlightDraft`는 Zustand 메모리 상태다.
- 페이지 재진입, 새로고침, 중간 이탈 뒤 복구하는 로직은 없다.
- `docs/media-pipeline.md`, `docs/video-upload-editing-spec.md`, `docs/testing/video-highlight-acceptance.md`가 요구하는 복구 기준을 아직 만족하지 못한다.

### 3. 원본과 결과물의 분리 저장
- 현재 구현은 기존 클립의 구간 메타데이터를 덮어쓴다.
- 최종 결과물 엔티티, 결과 영상 키, 별도 렌더 출력 저장은 없다.

### 4. 오버레이 편집과 저장
- 드래프트 데이터 구조에는 이름/번호/포지션 오버레이 필드가 있다.
- 하지만 실제 UI에서는 오버레이를 수정하지 못하고, 저장 API도 오버레이 값을 저장하지 않는다.

### 5. 테스트 기준의 핵심 회귀 커버
- 실패, 지연, 작은 화면, 재진입 복구, 저장 후 프로필 반영까지 닫는 Playwright 시나리오가 아직 없다.
- 현재 E2E는 새 UI의 존재 확인 수준에 더 가깝다.

## 바로 지우지 말고 보류해야 할 부분

### 1. `DecorateView`와 기존 spotlight/effects 저장 경로
- 메인 `/upload` 경로에서는 밀렸지만, `src/lib/upload-service.ts`는 아직 `spotlight_x`, `spotlight_y`, `freeze_at`, `effects`를 저장한다.
- `ClipPlayerSheet`, `HighlightsTabV5`, `HighlightSharePlayerClient`, `ReelShareClient`, `FeedList`가 이 메타데이터를 실제로 읽는다.
- 따라서 지금 당장 삭제하면 기존 클립 재생 경험과 공개 재생 경로가 흔들린다.

### 2. `/api/render/*`, `render-worker/`, `useGlobalRenderPolling`
- 메인 업로드 경로는 쓰지 않지만 `AppShell`이 `useGlobalRenderPolling()`를 실제로 마운트한다.
- `src/lib/upload-service.ts` 안에도 `startRenderUpload()`와 `/api/render` 호출 경로가 남아 있다.
- 실험 흔적 성격이 강해도, 정리 전에 완전 포기 여부를 먼저 결정해야 한다.

### 3. `/edit/[clipId]`와 `src/lib/highlight-generator.ts`
- 저장소 내부에서 이동 링크는 약하지만, 실제 라우트는 남아 있고 페이지가 직접 `highlight-generator`를 import한다.
- 연결이 약하다는 이유만으로 즉시 삭제할 단계는 아니다.

### 4. 기존 업로드 관련 테스트와 문서 흔적
- `tests/e2e/upload-wizard.spec.ts`, `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`, `CLAUDE.md`는 일부 내용이 낡았지만 아직 참조 지점이 있다.
- 먼저 현재 기준 문서를 잠그고, 그 다음에 현재 설명과 목표 설명을 나눠 정리해야 한다.

## 이번 단계 결론
- Prompt 5, 6 코드의 핵심 변화는 `/upload` 메인 경로를 스포트라이트 지정 중심에서 처리 상태 + 기본 하이라이트 검토 중심으로 옮긴 점이다.
- 문제는 이 변화가 현재 설명 문서보다 먼저 들어왔고, 저장 모델은 문서 목표보다 더 단순한 상태라는 점이다.
- 다음 단계는 삭제보다 동기화가 먼저다. 먼저 현재 구현 설명 문서를 다시 쓰고, 그 다음에 `DecorateView`, `/api/render`, `/edit/[clipId]` 같은 보류 대상을 실제 호출 근거와 함께 정리해야 한다.
