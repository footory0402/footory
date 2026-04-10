# Footory 저장소 감사 문서

## 감사 범위
- 코드 변경 없이 현재 저장소의 실제 기능, 죽은 코드, 중복 구현, 실험 흔적, 버려진 경로를 정리했다.
- 기준은 실제 라우트, 실제 import, 실제 API 호출, 실제 테스트 기대값이다.
- 설계 문서가 아니라 구현을 기준으로 분류했다.

## 빠른 요약
- 핵심 제품은 역할 기반 홈, 공개 프로필, 영상 업로드, 릴 생성, 팀, DM, 알림으로 동작한다.
- 영상 메인 플로우는 `/upload` 2단계 위저드와 부모 전용 `ParentQuickUpload` 두 축이다.
- 구형 영상 편집 스택과 렌더 파이프라인 흔적이 많이 남아 있다.
- 문서와 테스트 일부가 현재 구현을 따라오지 못하고 있다.

## 현재 사용 중

| 구분 | 경로/파일 | 근거 |
|---|---|---|
| 홈 역할 분기 | `src/app/page.tsx` | 선수, 부모, 스카우트 분기가 실제 서버 컴포넌트에서 실행된다. |
| 공개 프로필 | `src/app/p/[handle]/page.tsx`, `src/app/p/[handle]/client.tsx` | 프로필, 하이라이트, 기록, 커리어, 팔로우, DM, 관심 선수 저장이 여기에 연결된다. |
| 내 프로필 진입 | `src/app/profile/page.tsx` | 실제 화면이 아니라 `/p/[handle]`로 리다이렉트한다. |
| 탐색 | `src/app/discover/page.tsx` | 선수, 팀, 태그 탭과 검색 오버레이가 실제 동적 import로 구성된다. |
| MVP | `src/app/mvp/page.tsx`, `src/lib/server/mvp.ts` | 서버에서 후보 데이터를 만들어 클라이언트에 전달한다. |
| 팀 | `src/app/team/page.tsx`, `src/app/team/[id]/page.tsx`, `src/app/t/[handle]/page.tsx` | 팀 허브, 상세, 공개 팀이 모두 연결되어 있다. |
| DM | `src/app/dm/page.tsx`, `src/app/dm/[conversationId]/page.tsx` | 대화 목록과 스레드가 연결되어 있다. |
| 알림 | `src/app/(main)/notifications/page.tsx` | 목록, 그룹화, 읽음 처리, 설정 진입이 실제 구현되어 있다. |
| 일반 업로드 | `src/app/upload/page.tsx`, `src/components/upload/SelectView.tsx`, `src/components/upload/DecorateView.tsx`, `src/lib/upload-service.ts` | 현재 메인 업로드 흐름이다. |
| 부모 업로드 | `src/components/parent/ParentQuickUpload.tsx`, `src/app/api/parent/upload/route.ts` | 부모 대시보드에서 실제로 열리고 저장도 별도 API로 간다. |
| 릴 생성/재생 | `src/app/reel/create/page.tsx`, `src/app/reel/[id]/page.tsx`, `src/app/api/highlights/*` | 릴 생성과 릴 재생이 현재 연결되어 있다. |
| 관리자 영상 랩 | `src/app/admin/video-lab/page.tsx`, `src/components/admin/VideoLabClient.tsx` | 관리자 계정이 실제로 이 경로로 리다이렉트된다. |

## 영상 업로드/편집/스토리지 상세

## 현재 사용 중인 메인 영상 흐름
1. 사용자가 `/upload`에서 파일을 고른다.
2. `SelectView`가 파일 크기와 길이를 검사하고, 트림 구간과 duration을 스토어에 넣는다.
3. `prepareR2BackgroundUpload()`가 압축 가능 여부를 판단한 뒤 백그라운드 R2 업로드를 시작한다.
4. `DecorateView`가 `PinchZoomVideo`를 이용해 spotlight 좌표 또는 따라가기 포인트를 저장한다.
5. `startUpload()`가 R2 업로드 결과를 재사용하거나 직접 업로드하고, `/api/clips` 또는 `/api/parent/upload`로 메타데이터를 저장한다.
6. 썸네일 업로드는 `backgroundThumbnailUpload()`로 후행 처리된다.

## 관련 파일
- 클라이언트 페이지: `src/app/upload/page.tsx`
- 일반 선택/트림: `src/components/upload/SelectView.tsx`
- 포커스 설정: `src/components/upload/DecorateView.tsx`
- 업로드 상태: `src/stores/upload-store.ts`
- 업로드 오케스트레이션: `src/lib/upload-service.ts`
- presign: `src/app/api/upload/presign/route.ts`
- 직접 업로드 폴백: `src/app/api/upload/direct/route.ts`
- 멀티파트: `src/app/api/upload/multipart/route.ts`
- 메타데이터 저장: `src/app/api/clips/route.ts`
- 부모 메타데이터 저장: `src/app/api/parent/upload/route.ts`
- 썸네일 및 클립 후처리: `src/app/api/clips/[id]/route.ts`

## 현재 사용 중인 재생 경로
- 프로필 내부 재생: `src/components/player/ClipPlayerSheet.tsx`
- 개별 공유 재생: `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- 릴 재생: `src/app/reel/[id]/ReelShareClient.tsx`

## 현재 사용 중인 스토리지 흐름
- 원본/압축본 업로드 대상: Cloudflare R2
- 공개 URL 조합: `src/lib/r2-client.ts`
- R2 presign 생성: `src/lib/r2.ts`
- 영상 공개 링크는 DB의 `video_url`, `thumbnail_url`을 사용한다.

## 중복 구현

| 항목 | 파일 | 근거 |
|---|---|---|
| 업로드 UI 이중화 | `src/components/upload/SelectView.tsx` 와 `src/components/upload/VideoSelector.tsx` | 둘 다 파일 선택, 길이 검사, 미리보기를 따로 구현한다. 전자는 일반 업로드, 후자는 부모 업로드에만 사용된다. |
| 메타 입력 이중화 | `src/components/upload/DecorateView.tsx` 와 `src/components/upload/TagMemoForm.tsx` | 일반 업로드는 포커스 중심 UI를 쓰고, 부모 업로드는 태그/메모만 별도 폼으로 저장한다. |
| 업로드 서비스 이중화 | `src/lib/upload-service.ts` 와 `src/components/parent/ParentQuickUpload.tsx` 내부 업로드 로직 | 일반 업로드는 공용 서비스가 presign, 업로드, 썸네일을 처리하지만, 부모 업로드는 자체 `fetch`와 XHR 흐름을 다시 구현한다. |
| 재생 로직 분산 | `ClipPlayerSheet`, `HighlightSharePlayerClient`, `ReelShareClient` | spotlight, freeze, trim 관련 재생 로직이 한곳에 합쳐져 있지 않다. |

## 실험 흔적

| 대상 | 분류 근거 | 판단 |
|---|---|---|
| `src/lib/upload-service.ts`의 `startRenderUpload()` | 함수 주석에 `v1.3 렌더 파이프라인`이 남아 있고 현재 호출처가 없다. | 실험 흔적 |
| `src/app/api/render/route.ts` | 파일 최상단에 `현재 미사용` 주석이 있고, 현재 메인 `/upload`는 이 경로를 타지 않는다. | 실험 흔적 |
| `src/app/api/render/[id]/route.ts` | `useGlobalRenderPolling()`에서만 대기하고 있지만, 메인 업로드 플로우에서 `rendering` 상태로 진입하지 않는다. | 실험 흔적 |
| `src/lib/render-api.ts` | 렌더 워커 호출 래퍼인데 `api/render` 외 다른 실사용 연결이 없다. | 실험 흔적 |
| `render-worker/` 전체 | Cloudflare Container 기반 렌더 서버가 남아 있지만 현재 기본 업로드 경로는 런타임 오버레이 중심이다. | 실험 흔적 |
| `src/app/edit/[clipId]/page.tsx` 와 `src/lib/highlight-generator.ts` | 클라이언트에서 영상 생성하는 편집 경로지만 저장소 내 탐색 코드에서 이 경로로 이동하는 곳이 없다. | 실험 흔적 |
| `src/app/admin/video-lab/*`, `src/lib/video-lab.ts` | 관리자 전용으로 실제 접근 경로는 있지만 서비스 핵심 업로드와는 분리된 실험성 기능이다. | 실험 흔적이지만 운영 중 |
| 루트의 `playwright-*.md` 스냅샷 문서 | `git status --short`에서 추적되지 않는 테스트 산출물로 확인된다. | 실험 산출물 |

## 삭제 후보

| 대상 | 근거 | 메모 |
|---|---|---|
| `src/app/editor/video/page.tsx` | 현재 구현은 `/upload`로 즉시 리다이렉트만 수행한다. | 단독 삭제보다 관련 구형 편집 스택 정리와 함께 처리 권장 |
| `src/app/upload/child/[id]/page.tsx` | 파일명은 child upload 경로인데 실제 내용은 자녀 프로필 편집이다. 저장소 내 다른 파일에서 이 경로로 이동하는 코드가 확인되지 않았다. | 경로 의미와 구현이 불일치 |
| `src/components/editor/video/ClipList.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/ClipMarker.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/ClipThumbnail.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/ClipTimeline.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/ConfirmView.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/DoneView.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/HudConfigPanel.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/ProcessingView.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/SpotlightOverlay.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/SpotlightSetupView.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/VideoPlayer.tsx` | 현재 라우트/컴포넌트에서 import되지 않는다. | 구형 편집 스택 |
| `src/components/editor/video/FrameNavigator.tsx` | `SpotlightSetupView` 내부에서만 사용되며 그 상위가 끊겨 있다. | 구형 편집 스택 |
| `src/components/editor/video/PlayerMarker.tsx` | `ClipThumbnail` 내부에서만 사용되며 상위가 끊겨 있다. | 구형 편집 스택 |
| `src/components/upload/ShareView.tsx` | 현재 `/upload` 페이지는 `share` 단계를 즉시 `decorate`로 되돌린다. 이 컴포넌트 import가 없다. | 구형 3단계 업로드 흔적 |
| `src/components/upload/CaptionTab.tsx` | 현재 import가 없다. | 구형 탭 UI 흔적 |
| `src/components/upload/SlowmoTab.tsx` | 현재 import가 없다. | 구형 탭 UI 흔적 |
| `src/components/upload/BgmSelector.tsx` | 현재 import가 없다. | 구형 탭 UI 흔적 |
| `src/components/upload/guide/CoachMark.tsx` | 현재 import가 없다. | 테스트에만 흔적이 남아 있음 |
| `src/components/video/CaptionOverlay.tsx` | 현재 import가 없다. | 런타임 캡션 UI 후보였으나 비연결 |
| `src/components/video/EffectsToggle.tsx` | 현재 import가 없다. | 구형 효과 선택 UI 흔적 |
| `src/components/profile/ProfileCompletionGuide.tsx` | 현재 import가 없고 파일 내부 인터페이스 중복까지 남아 있다. | 미사용 안내 UI |
| `src/components/player/ProfileSkeleton.tsx` | 현재 import가 없다. | 미사용 스켈레톤 |
| `src/components/ui/EmptyCTA.tsx` | 현재 import가 없다. | 미사용 공용 UI |
| `src/lib/hud-canvas-renderer.ts` | 현재 import가 없다. | Canvas HUD 실험 코드 |
| `src/lib/skill-labels.ts` | 현재 테스트 외 사용처가 보이지 않는다. | 런타임 미사용 유틸 |
| 루트의 `playwright-login-snapshot.md`, `playwright-login-snapshot2.md`, `playwright-profile-snapshot.md`, `playwright-profile-snapshot3.md`, `playwright-reel-after-preview.md` | 모두 추적되지 않는 스냅샷 산출물이다. | 즉시 정리 가능 |

## 보류

| 대상 | 보류 이유 |
|---|---|
| `src/components/upload/VideoSelector.tsx`, `src/components/upload/TagMemoForm.tsx` | 중복 구현이지만 부모 업로드에서 실제 사용 중이다. |
| `src/app/api/stats/team-rank/route.ts` | 저장소 내부 호출은 찾지 못했지만 독립 API라 외부 호출 가능성을 배제할 수 없다. |
| `src/hooks/useGlobalRenderPolling.ts` 와 업로드 스토어의 render 관련 상태 | 현재 메인 플로우에서는 거의 비활성처럼 보이지만 `AppShell`에 실제 마운트되어 있다. |
| `render-worker/` 전체 | 실험 흔적 성격이 강하지만, 삭제 전에 제품이 서버 렌더 파이프라인을 완전히 포기하는지 결정이 필요하다. |
| `src/app/edit/[clipId]/page.tsx`, `src/lib/highlight-generator.ts` | 현재 연결은 끊겨 있지만 수동 운영 경로일 가능성을 배제하려면 확인이 더 필요하다. |
| `src/components/admin/VideoLabClient.tsx` 와 `src/app/api/admin/video-lab/*` | 실험성은 강하지만 관리자 운영 기능으로 실제 접근 경로가 있다. |
| `src/__tests__/upload-service.test.ts`, `src/__tests__/upload-editor-regression.test.tsx`, `src/__tests__/spotlight-math.test.ts` | 현재 워크트리에 추적되지 않는 테스트 파일이다. 실수 산출물인지 작업 중인 변경인지 확인이 필요하다. |

## 문서와 구현의 불일치

| 문서/테스트 | 실제 코드 | 차이 |
|---|---|---|
| `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md` | `src/lib/upload-service.ts` | archived 문서는 `MULTIPART_THRESHOLD`를 200MB로 설명하지만 실제 코드는 50MB다. |
| `CLAUDE.md`의 `/editor/video` 설명 | `src/app/editor/video/page.tsx` | 문서는 하이라이트 에디터 경로로 설명하지만 실제 라우트는 `/upload` 리다이렉트다. |
| `CLAUDE.md`의 `/upload/child/[id]` 설명 | `src/app/upload/child/[id]/page.tsx` | 문서는 부모용 자녀 업로드로 설명하지만 실제 코드는 자녀 프로필 편집 페이지다. |
| `tests/e2e/video/video-upload-flow.spec.ts` | `src/app/upload/page.tsx`, `src/components/upload/DecorateView.tsx` | 테스트는 `꾸미기 -> 태그 -> 효과 -> 공유`의 구형 흐름과 코치마크를 기대하지만 현재 구현은 그 구조가 아니다. |

## 버려진 경로 판단 근거
- `/editor/video`는 독립 화면이 아니라 즉시 리다이렉트다.
- `/upload/child/[id]`는 실제로 다른 화면에서 링크되지 않는다.
- `/edit/[clipId]`는 라우트는 존재하지만 저장소 내부에서 이동 경로가 확인되지 않는다.
- `ClipPlayerSheet`의 `onHighlightEdit`는 prop 자리는 남아 있지만 실제로 넘겨주는 호출처가 없다.

## 지금 기준 결론
- 제품의 실제 중심은 공개 프로필과 `/upload` 기반 런타임 재생 오버레이 흐름이다.
- 저장소에는 구형 영상 편집 스택, 서버 렌더 파이프라인, 관리자용 실험 기능이 함께 남아 있어 구조가 흐려져 있다.
- 삭제는 가능하지만 한 번에 지우기보다 먼저 영상 축의 단일 소스 오브 트루스를 정한 뒤 단계적으로 정리해야 한다.
