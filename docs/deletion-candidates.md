# 정리 후보 목록

> Last updated: 2026-04-10
> 이번 단계: safe cleanup executed
> 기준: 실제 import, 실제 route, 실제 test, 실제 메타데이터 소비 경로

## 0. 이번 배치 실행 결과 (2026-04-10)

### 실행 완료
- `src/components/upload/DecorateView.tsx`
  - 근거: `rg -n "DecorateView" src tests` 기준 import, route, test 호출이 없었다.
- `src/components/upload/UploadBottomSheet.tsx`
  - 근거: `BottomTab`에서만 동적 import되던 dead branch였고 `setSheetOpen(true)` 경로가 없었다.

### 통합 완료
- `src/components/upload/SelectView.tsx`
- `src/components/upload/VideoSelector.tsx`
- `src/components/upload/UploadInlineError.tsx`
- `src/lib/upload-video-file.ts`

정리 내용:
- 파일 선택 검증을 `validateUploadVideoFile()`로 통합했다.
- 두 화면의 동일한 에러 박스를 `UploadInlineError`로 통합했다.
- `SelectView`의 보조 안내 문구와 `UploadProfileCardEditor`의 `편집 후 기본 포함` 배지를 제거했다.

## 1. 현재 기준이 되는 영상 핵심 플로우

### 직접 연결 파일
- `src/app/upload/page.tsx`
- `src/components/upload/SelectView.tsx`
- `src/components/upload/UploadProcessingView.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/components/upload/SingleClipEditorPreview.tsx`
- `src/lib/highlight-save.ts`
- `src/lib/single-clip-playback.ts`
- `src/lib/upload-service.ts`
- `src/stores/upload-store.ts`
- `src/app/api/clips/[id]/route.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`

## 2. 보류해야 할 위험 영역

- `src/stores/upload-store.ts`
  - 이유: 레거시 필드가 남아 있어도 `upload-service`, global indicator, API payload, draft sync와 결합돼 있다.
- `src/lib/upload-service.ts`
  - 이유: background upload, abort, render fallback, parent upload 재사용 경로가 얽혀 있다.
- `src/lib/single-clip-playback.ts`
  - 이유: share / reel / profile playback contract 공통 기준이다.
- `src/app/api/clips/[id]/route.ts`
  - 이유: trim, spotlight, overlay, save metadata 저장 계약을 직접 가진다.
- share / reel / profile 재생 소비 경로
  - 대상: `src/components/player/ClipPlayerSheet.tsx`, `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`, `src/app/reel/[id]/ReelShareClient.tsx`, `src/components/profile/HighlightsTabV5.tsx`
  - 이유: 업로드 화면만 보고 필드를 줄이면 저장 후 재생 회귀가 늦게 드러난다.

## 3. 다음 배치 전 확인 메모

- `docs/archive/2026-04-10/deletion-candidates.md`는 이번 파일의 이전 스냅샷이다.
- `docs/repo-audit.md`, `docs/app-overview.md`에는 이미 현재 구현과 어긋난 업로드 설명이 남아 있으므로 다음 문서 정리 배치에서 현재 흐름 기준으로 다시 맞춰야 한다.
