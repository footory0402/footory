# 정리 후보 목록

> Last updated: 2026-04-10
> 이번 단계: safe cleanup executed
> 기준: 실제 import, 실제 라우트, 실제 테스트, 실제 메타데이터 소비 경로

## 0. 이번 배치 실행 결과 (2026-04-10)

### 실행 완료 (실제 제거)
- `playwright-login-snapshot.md`
- `playwright-login-snapshot2.md`
- `playwright-profile-snapshot.md`
- `playwright-profile-snapshot3.md`
- `playwright-reel-after-preview.md`
- `src/components/upload/DoneView.tsx`
- `src/components/editor/video/DoneView.tsx`

### 보류 (이번 배치 제외)
- `src/components/upload/DecorateView.tsx`
  - 이유: 현재 import는 없지만 spotlight/effects/tracking 관련 문서 근거와 연결돼 있어 성급한 삭제를 보류.
- `src/stores/upload-store.ts` 레거시 필드 정리
  - 이유: `upload-service`, global indicator, API payload 계약과 간접 결합.
- `src/lib/upload-service.ts` reset/cancel, render 관련 분기
  - 이유: ship blocker 1순위 영역과 직접 연결되어 저위험 정리 범위를 초과.

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

### 핵심 플로우와 강하게 결합된 소비 경로
- `src/components/player/ClipPlayerSheet.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`
- `src/components/profile/HighlightsTabV5.tsx`
- `src/hooks/useClips.ts`
- `src/components/feed/FeedList.tsx`
- `src/app/p/[handle]/page.tsx`
- `src/app/p/[handle]/h/[clipId]/page.tsx`
- `src/app/reel/[id]/page.tsx`

## 2. 삭제 후보

### A. 바로 정리 가능한 저위험 후보

| 파일 또는 영역 | 분류 | 핵심 플로우 결합 | 근거 | 위험도 |
| --- | --- | --- | --- | --- |
| `src/components/upload/DecorateView.tsx` | 구형 spotlight 지정 화면 | 간접 | `rg -n "DecorateView" src tests` 기준 실제 import가 없고 `PinchZoomVideo` 주석만 남아 있다. 현재 `/upload`는 `processing -> review`로만 진입한다. | 낮음 |

### B. 현재 워크트리에서 이미 삭제됐지만 복구하지 말고 확인만 하면 되는 후보

| 파일 | 분류 | 핵심 플로우 결합 | 근거 | 위험도 |
| --- | --- | --- | --- | --- |
| `src/components/editor/video/DoneView.tsx` | 구형 업로드 완료 화면 | 없음 | import/route/test 연결이 없고 이번 배치에서 삭제 완료했다. | 낮음 |
| `src/components/upload/ShareView.tsx` | 구형 업로드 share 단계 | 없음 | 현재 `/upload`에서 `share` phase는 `select`로 정렬되고, 코드 검색 기준 import가 없다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/upload/CaptionTab.tsx` | 과기능 편집 탭 | 없음 | 현재 업로드/재생 경로에서 import가 없고 이번 범위 밖인 캡션 탭이다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/upload/SlowmoTab.tsx` | 과기능 편집 탭 | 없음 | 현재 업로드/재생 경로에서 import가 없고 이번 범위 밖인 슬로모션 탭이다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/upload/BgmSelector.tsx` | 과기능 편집 탭 | 없음 | 현재 업로드/재생 경로에서 import가 없고 BGM 편집 UI는 `/upload` 메인 플로우에서 빠져 있다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/upload/guide/CoachMark.tsx` | 구형 가이드 UI | 없음 | 현재 업로드 경로와 테스트에서 호출되지 않는다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/video/CaptionOverlay.tsx` | 비연결 재생 UI | 없음 | 현재 재생 경로는 `VideoOverlay`, `HudOverlay` 중심이고 파일 검색 기준 import가 없다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/video/EffectsToggle.tsx` | 구형 효과 토글 | 없음 | 현재 업로드/재생 경로에서 import가 없다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/profile/ProfileCompletionGuide.tsx` | 미사용 프로필 보조 UI | 없음 | 현재 import가 없고 프로필 탭 내부에 자체 empty/CTA 구현이 있다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/components/player/ProfileSkeleton.tsx` | 미사용 플레이어 보조 UI | 없음 | 현재 import가 없고 파일 자체가 워크트리에서 삭제 상태다. | 낮음 |
| `src/components/ui/EmptyCTA.tsx` | 미사용 공용 UI | 없음 | 현재 import가 없고 `HighlightsTabV5`는 내부 `FeaturedEmptyCTA`를 따로 구현한다. 현재 워크트리에서도 삭제 상태다. | 낮음 |
| `src/lib/hud-canvas-renderer.ts` | 구형 실험 유틸 | 없음 | 현재 runtime/test import가 없고 워크트리에서도 삭제 상태다. | 낮음 |

## 3. 통합 후보

| 후보 | 이유 | 핵심 플로우 결합 | 메모 | 위험도 |
| --- | --- | --- | --- | --- |
| `src/components/upload/SelectView.tsx` + `src/components/upload/VideoSelector.tsx` | 둘 다 파일 선택, 길이/용량 검사, duration 저장, 업로드 준비를 담당한다. | 높음 | `SelectView`는 메인 `/upload`, `VideoSelector`는 `ParentQuickUpload`에서 사용한다. 바로 하나를 지우기보다 공통 입력 훅/유틸 추출이 먼저다. | 중간 |
| `src/components/upload/HighlightSuggestionReview.tsx` + `src/lib/single-clip-playback.ts` | 편집 UI와 draft 정규화/패치 생성 책임이 나뉘어 있지만 한 화면 안에서 상태 변경 책임이 커졌다. | 높음 | 지금은 동작을 유지하고, 이후 `trim/spotlight/zoom/overlay/save target` 단위로 슬라이스 분리 검토가 필요하다. | 중간 |
| `src/components/layout/BottomTab.tsx` + `src/components/upload/UploadBottomSheet.tsx` | `UploadBottomSheet`는 동적 import되지만 `setSheetOpen(true)` 경로가 없어 사실상 죽은 분기다. | 낮음 | 업로드 진입을 `/upload` 직접 push로 고정할지, 시트를 복구할지 먼저 결정해야 한다. | 중간 |
| `src/lib/upload-service.ts` + `src/components/parent/ParentQuickUpload.tsx` 내부 업로드 로직 | presign, direct upload fallback, thumbnail, clip 저장이 두 곳에 분산돼 있다. | 높음 | 부모 업로드는 별도 API(`/api/parent/upload`)를 쓰므로 함수 단위 공통화가 안전하다. | 중간 |

## 4. 보류 후보

| 파일 또는 영역 | 분류 | 핵심 플로우 결합 | 보류 근거 | 위험도 |
| --- | --- | --- | --- | --- |
| `src/stores/upload-store.ts`의 `render`, `slowmo`, `captions`, `bgm`, `tracking` 관련 필드 | 레거시/확장 상태 과다 | 매우 높음 | 필드 일부는 죽은 것처럼 보여도 `upload-service`, `DecorateView`, `GlobalUploadIndicator`, `/api/clips`, 공유 플레이어 소비 계약과 얽혀 있다. 필드 단위 삭제는 별도 호출표가 필요하다. | 높음 |
| `src/lib/upload-service.ts`의 `startRenderUpload()` 및 렌더 경로 | 레거시 서버 렌더 파이프라인 | 높음 | `startRenderUpload()`와 `/api/render` 호출 흔적이 남아 있고, store 상태와 재시도 로직을 같이 건드린다. | 높음 |
| `src/hooks/useGlobalRenderPolling.ts` + `src/app/api/render/*` | 레거시 폴링/렌더 상태 경로 | 높음 | `AppShell`이 실제로 훅을 마운트하고, `tests/e2e/upload-wizard.spec.ts`가 `/api/render` 인증 가드를 검증한다. | 높음 |
| `src/app/edit/[clipId]/page.tsx` + `src/lib/highlight-generator.ts` | 구형 편집 라우트 | 중간 | 현재 라우트가 살아 있고 페이지가 동적 import로 생성기를 직접 호출한다. 링크가 약하더라도 즉시 삭제 단계는 아니다. | 높음 |
| `src/components/parent/ParentQuickUpload.tsx` + `src/components/upload/VideoSelector.tsx` + `src/components/upload/TagMemoForm.tsx` | 부모 전용 업로드 서브플로우 | 높음 | 메인 `/upload`와 중복이 크지만 실제 부모 업로드 진입점이다. 공통화 설계 전 삭제하면 부모 흐름이 바로 깨진다. | 높음 |
| `src/lib/skill-labels.ts` | 테스트 전용 유틸 | 낮음 | 런타임 import는 없지만 `src/__tests__/skill-labels.test.ts`가 남아 있어 테스트 정리와 함께 판단해야 한다. | 중간 |

## 5. 지금 당장 손대면 위험한 영역

### A. single clip playback contract 소비 영역
- `src/lib/single-clip-playback.ts`
- `src/app/api/clips/[id]/route.ts`
- `src/components/player/ClipPlayerSheet.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`
- `src/components/profile/HighlightsTabV5.tsx`

이 묶음은 `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.focusZoom`, `effects.showLowerThird`, `trackingMode`, `trackingPoints`를 같은 계약으로 소비한다. 한 군데만 줄이면 업로드 저장은 되는데 재생/공유/프로필 탭이 어긋나는 회귀가 난다.

### B. 업로드 상태와 R2/렌더 혼합 영역
- `src/stores/upload-store.ts`
- `src/lib/upload-service.ts`
- `src/components/upload/GlobalUploadIndicator.tsx`
- `src/hooks/useGlobalRenderPolling.ts`
- `src/components/layout/AppShell.tsx`

현재 메인 `/upload`는 `processing -> review`로 옮겨갔지만, store/status 체계에는 여전히 R2 background upload와 render polling 단계가 같이 들어 있다. 이 영역은 dead code처럼 보이는 상태값이 실제 indicator/재시도/UI 셸에 걸려 있어 조심해야 한다.

### C. 업로드 이후 소비 경로
- `src/app/p/[handle]/page.tsx`
- `src/hooks/useClips.ts`
- `src/components/feed/FeedList.tsx`
- `src/components/profile/HighlightsTabV5.tsx`
- `src/app/reel/[id]/page.tsx`

업로드 후 저장된 메타데이터가 프로필, 피드, 공유 링크, 릴 미리보기까지 흘러간다. 업로드 화면만 보고 trim/spotlight/effects 필드를 정리하면 소비 경로에서 늦게 깨진다.

## 6. 이번 스캔 결론

- 저위험 삭제 후보는 `현재 import/route/test가 완전히 끊긴 구형 업로드 화면`과 `루트 실험 산출물` 중심이다.
- 가장 위험한 영역은 `파일 단위`보다 `store 상태`, `clip PATCH 계약`, `재생 소비 경로`다.
- 다음 실제 정리 단계에서는 파일 삭제보다 먼저 `upload-store 필드별 소비 표`와 `부모 업로드 공통화 범위`를 잠그는 편이 안전하다.
