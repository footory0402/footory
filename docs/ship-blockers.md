# Footory 영상 기능 Ship Blockers

> Last checked: 2026-04-10
> 기준: 실제 코드 기준, 새 기능 제안 없음

## 2026-04-10 구현 반영
- 해결 완료 0: 업로드 완료 후 편집 화면 진입 blocker 해소
  - 원인: `src/components/upload/UploadProcessingView.tsx`의 완료 상태 기본 CTA가 `다른 파일 선택`뿐이라 사용자가 편집 route로 진입할 수 없었다.
  - 수정: 업로드 완료 후 `편집 화면으로 이동` CTA를 노출하고 `/edit/[clipId]` route를 현재 single-clip 편집 UI 진입점으로 연결했다.
  - 식별자: editor route는 최소 `clipId`를 path로 받고, draft가 있으면 `projectId`를 query로 함께 받는다.
- 해결 완료 1: 업로드 중 reset/cancel과 실제 업로드 abort 연결
  - `src/app/upload/page.tsx`에서 reset 전에 `abortActiveUploadWork()`를 호출하도록 변경
  - `src/lib/upload-service.ts`에 foreground/background 업로드 중단 진입점(`abortActiveUploadWork`) 추가
  - 업로드 실행 흐름(`startUpload`, `startR2BackgroundUpload`)에 abort signal/generation guard를 연결해 reset 이후 stale write를 차단
- 해결 완료 2: `src/app/api/video-projects/route.ts` 타입 안정성 오류 3건 해결
  - 과도한 커스텀 supabase 타입 경로를 제거하고 GET 경로 내 clip/tags 조회를 단순화
- 해결 완료 3: single-clip 편집 draft 저장/복구 불안정
  - 원인: `/upload` 복구는 draft payload를 쓰고 있었지만 `/edit/[clipId]` 직접 재진입은 `clips` 메타데이터만 다시 읽어 unpublished draft 편집값이 빠질 수 있었다.
  - 수정: `src/lib/video-projects.ts`에 clip 기준 single-clip draft 조회를 추가하고, `/upload`와 `/edit/[clipId]` 모두 trim, spotlight, freeze, zoom, overlay 기준값을 같은 draft payload에서 복구하도록 정렬했다.
  - 검증: `tests/e2e/video/video-upload-flow.spec.ts`에 `업로드 -> 편집 -> 값 변경 -> /upload 재진입 복구`, `/edit 재진입 복구` 시나리오를 추가했고 `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`에서 통과했다.
- 해결 완료 4: share/reel/profile single-clip playback contract 1차 정렬
  - 원인: profile/share/reel이 trim 길이와 single-clip playback metadata를 각자 snake_case 매핑으로 소비해 trim/duration/effects 계산이 경로별로 달라질 수 있었다.
  - 수정: `src/lib/single-clip-playback.ts`에 공통 contract builder를 추가하고 profile/share/reel 소비 경로가 trim 우선 playable duration, spotlight/freeze/zoom/overlay metadata를 같은 매핑으로 읽도록 정렬했다.
  - 검증: `video-player.spec.ts`를 로그인 + mock 소비 경로 기준으로 정렬하고, owner 프로필에서 `/api/highlights` 재조회로 릴 카드 회귀를 고정해 `npm run test:video`에서 통과했다.
  - 결과: public profile/reel/player playback E2E 검증 공백 blocker는 해소했다.
- 해결 완료 5: single-clip draft store 동기화 경로 최소 정렬
  - 원인: `/upload`와 `/edit/[clipId]`가 draft payload를 업로드 스토어로 주입할 때 같은 필드 묶음을 공유하지 않아 trim/spotlight/freeze/zoom/overlay 복구 기준이 경로별로 흔들릴 수 있었다.
  - 수정: `src/lib/single-clip-store-sync.ts`를 추가해 `draft -> upload-store` 및 `store -> draft` 변환을 공통 함수로 묶고, `/upload` 복구/저장과 `/edit/[clipId]` 재진입 복구가 동일 동기화 유틸을 사용하도록 정렬했다.
  - 검증: `tests/e2e/video/video-upload-flow.spec.ts`에 가이드 오버레이 간섭 플래키를 제거하고(`닫기` 처리 + spotlight/freeze 즉시 검증), `업로드 -> 편집 -> 값 변경 -> 저장 -> 재진입(/upload, /edit)` 시나리오를 iPhone 15에서 재통과시켰다.
  - 결과: single-clip 편집 저장/복구는 trim, spotlight, freeze, zoom, profile card/lower third overlay 기준으로 재진입 복구가 닫혔다.
- 해결 완료 6: upload-store 레거시 필드 과다로 인한 상태 결합 완화
  - 원인: `setFile`이 핵심 clip-first 상태만 부분 초기화해 이전 업로드의 event/tag/tracking/slowmo/bgm/R2 상태가 다음 업로드로 누수될 수 있었다.
  - 수정: `src/stores/upload-store.ts`에 clip-flow 기본 상태 팩토리를 추가하고, `setFile`이 파일 교체 시 레거시 편집/업로드 상태를 기본값으로 정렬하도록 변경했다(단, parent/general context와 child/challenge 식별자는 유지).
  - 검증: `src/__tests__/upload-store.test.ts`에 `setFile` 경계 테스트를 추가했고 `npm run test:run`에서 통과했다.
  - 결과: 새 파일 선택 시 단일 업로드 핵심 플로우와 레거시 필드 결합이 분리됐다.
- 해결 완료 7: upload-service / ParentQuickUpload 업로드 로직 중복 축소
  - 원인: `ParentQuickUpload`가 presign/R2 업로드/클립 저장을 별도 구현해 일반 `/upload` 경로와 수정 포인트가 분리돼 있었다.
  - 수정: `src/components/parent/ParentQuickUpload.tsx`가 공용 업로드 진입점 `startUpload`를 재사용하도록 변경하고, 완료/실패 UI는 기존 컴포넌트 상태로 유지했다.
  - 검증: `npm run lint`, `npm run typecheck`, `npm run test:run` 통과 + `video-upload-flow` smoke 2건(iPhone 15) 통과.
  - 결과: parent/general 업로드가 동일 서비스 경로를 사용해 동작 불일치 위험을 줄였다.
- 안정화 보강: featured 연결 실패 시 부분 성공 안내 추가
  - 원인: clip 저장 성공 + featured 연결 실패가 한 번에 실패로 보이면 사용자가 저장 유실로 오해할 수 있었다.
  - 수정: `publishSingleClipDraft`가 featured 연결 실패를 부분 성공으로 반환하고, `/profile?saved=clip` 배너로 재시도 맥락을 안내한다.
  - 검증: `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '업로드 뒤 바로 편집에 들어갈 수 있다|/edit 재진입에서도 최근 single-clip draft를 복구한다|저장하면 프로필 대표 영상에 반영된다'` 통과(`3 passed`).

## 우선순위 순서 (남은 0개)
- 현재 `Blocker` 없음

## 2026-04-10 현재 기준 재분류 (사용자 영향 기준)

### `Blocker` (1~3순위)
- 현재 없음

### `Important` (현재 blocker는 아님)
- 320px 전후 작은 화면 전용 회귀 미검증
- 느린 네트워크 업로드 전용 E2E 부재
- 로컬 미리보기와 원격 재생 자산 검증 분리

### `Nice to have`
- reel transition 저장 미지원
- lint warning 정리

## Resolved 0. 업로드 후 편집 화면 진입 불가
- 상태: `해결 완료 (2026-04-10)`
- 막힌 원인
  - `src/components/upload/UploadProcessingView.tsx`가 업로드 완료 또는 draft 준비 이후에도 기본 하단 CTA를 `다른 파일 선택`만 노출했다.
  - `/edit/[clipId]` route는 살아 있었지만 현재 single-clip 편집 UI와 연결되지 않아, 업로드 결과를 들고 진입할 공식 경로가 없었다.
- 반영 파일
  - `src/components/upload/UploadProcessingView.tsx`
  - `src/app/edit/[clipId]/page.tsx`
  - `src/app/api/clips/[id]/route.ts`
  - `tests/e2e/video/video-upload-flow.spec.ts`
- 복구 방식
  - 업로드 완료 후 processing 화면 하단에 `편집 화면으로 이동` CTA 노출
  - CTA는 `/edit/[clipId]?from=upload&projectId=...` 형태로 진입
  - `/edit/[clipId]`는 현재 single-clip editor UI(`HighlightSuggestionReview`)를 직접 렌더링
  - 로컬 업로드 파일이 남아 있으면 object URL을 우선 사용하고, 아니면 `/api/clips/[id]`에서 clip metadata와 `video_url`을 읽어 편집 draft를 복원
- 확인 포인트
  - 사용자가 clip 업로드 완료 상태를 본 뒤 명시적으로 편집 화면으로 들어갈 수 있어야 함
  - editor route가 `clipId`를 path로 받고, 가능한 경우 `projectId`를 query로 받아 draft 문맥을 이어가야 함
  - 편집 화면 진입 후 `single-clip-editor` 주요 도구가 표시돼야 함

## Resolved 1. 업로드 중 reset/cancel 원자성 부재
- 상태: `해결 완료 (2026-04-10)`
- 반영 파일
  - `src/lib/upload-service.ts`
  - `src/app/upload/page.tsx`
- 확인 포인트
  - reset/cancel 시 foreground/background 업로드를 함께 abort
  - 업로드 중 이탈 후 이전 비동기 완료 신호가 store를 다시 덮어쓰는 race를 generation guard로 차단
  - 중복 reset 호출에도 중단 동작이 idempotent하게 처리

## Resolved 2. src/app/api/video-projects/route.ts 타입 안정성 미완료
- 상태: `해결 완료 (2026-04-10)`
- 반영 파일
  - `src/app/api/video-projects/route.ts`
- 확인 포인트
  - typecheck 실패 원인 3건 제거
  - API 계약 확장 없이 기존 응답 구조 유지

## Resolved 3. single-clip draft 재진입 복구 불안정
- 상태: `해결 완료 (2026-04-10)`
- 막힌 원인
  - `/upload`의 `최근 편집 이어서 하기`는 `video_projects` payload를 사용했지만, `/edit/[clipId]` 직접 재진입은 latest draft를 다시 읽지 않아 unpublished 편집값이 빠질 수 있었다.
  - 복구 시 store primitive와 editor draft가 일부 분리돼 trim 외 spotlight/freeze/zoom/overlay 기준이 경로별로 어긋날 여지가 있었다.
- 반영 파일
  - `src/lib/video-projects.ts`
  - `src/app/upload/page.tsx`
  - `src/app/edit/[clipId]/page.tsx`
  - `tests/e2e/video/video-upload-flow.spec.ts`
- 복구 방식
  - `clipId` 기준 latest single-clip draft 조회를 추가해 `/edit/[clipId]`가 server draft를 직접 복원
  - `/upload` draft 복구 시 trim, spotlight, freeze, zoom, overlay 효과를 store와 editor draft에 함께 반영
  - iPhone 15 Playwright에서 `/upload` 재진입과 `/edit` 직접 재진입 둘 다 검증
- 확인 포인트
  - draft 저장 대상: trim, spotlight, freeze, zoom, overlay, highlight range, save target
  - unpublished 상태에서도 다시 열었을 때 마지막 편집값이 유지돼야 함
  - publish/profile 확장 없이 single-clip 범위만 안정화해야 함

### 2026-04-10 2차 보정
- `src/lib/single-clip-store-sync.ts`로 `/upload`, `/edit/[clipId]` 공통 동기화 경로를 통일했다.
- `tests/e2e/video/video-upload-flow.spec.ts`에서 가이드 오버레이 간헐 노출로 인한 클릭 실패를 흡수해 재진입 복구 시나리오를 안정화했다.
- 검증 결과:
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'` → `5 passed`
  - `npm run test:video` → `14 passed`

### 2026-04-10 마무리 확인
- 이번 턴은 blocker를 `single-clip draft store 동기화 경로 최소 정렬` 1개로 고정하고 범위를 추가 확장하지 않았다.
- 최소 회귀 검증:
  - `npm run lint` → 통과 (`65 warnings`)
  - `npm run typecheck` → 통과
  - `npm run test:run` → 통과 (`8 files / 52 tests`)
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'` → `4 passed, 1 failed`
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '편집 값을 바꾸면|/edit 재진입'` → `2 passed`
- 범위 외 메모:
  - 실패 1건은 `저장하면 프로필 대표 영상에 반영된다`에서 `대표 영상` 텍스트 가시성 확인 실패이며, blocker 5 동기화 경로 자체와 분리된 profile 표기 확인 이슈로 남긴다.

## Resolved 4. public profile/share/reel playback E2E 검증 공백
- 상태: `해결 완료 (2026-04-10)`
- 반영 파일
  - `tests/e2e/video/video-player.spec.ts`
  - `tests/e2e/video/profile-card-editor.spec.ts`
  - `src/components/profile/HighlightsTabV5.tsx`
- 확인 포인트
  - `video-player.spec.ts` 3개 시나리오가 iPhone 15에서 통과
  - `profile-card-editor.spec.ts` 비로그인 케이스를 현재 인증 정책(로그인 이동)과 일치시켜 통과
  - `npm run test:video` 전체 14개 시나리오 통과

## Resolved 6. upload-store 레거시 필드 과다
- 상태: `해결 완료 (2026-04-10)`
- 반영 파일
  - `src/stores/upload-store.ts`
  - `src/__tests__/upload-store.test.ts`
- 확인 포인트
  - `setFile`에서 clip-first 핵심 플로우와 무관한 레거시 편집/업로드 상태(event/tracking/slowmo/bgm/r2/compress)가 기본값으로 정렬돼야 함
  - parent/general 업로드 컨텍스트와 child/challenge 식별자는 유지돼야 함
  - 새 파일 선택 후 `/upload -> processing -> review` 진입이 기존과 동일하게 동작해야 함

## Resolved 7. upload-service / ParentQuickUpload 로직 중복
- 상태: `해결 완료 (2026-04-10)`
- 반영 파일
  - `src/components/parent/ParentQuickUpload.tsx`
- 확인 포인트
  - parent 업로드가 공용 `startUpload` 서비스 경로를 재사용해야 함
  - parent 업로드 완료/실패 UI 흐름(`done`, `error`)은 기존과 동일해야 함
- 일반 `/upload` 업로드 흐름과 parent 경로의 업로드/저장 로직이 분산 구현되지 않아야 함

## Resolved 8. 저장 후 프로필 대표 영상 반영 확인 불안정
- 상태: `해결 완료 (2026-04-10)`
- 막힌 원인
  - 저장 직후 `/profile` 진입에서 반영 완료 신호가 즉시 노출되지 않아 사용자가 저장 실패로 오해할 수 있었다.
  - `video-upload-flow`의 `저장하면 프로필 대표 영상에 반영된다` 케이스에서 `대표 영상` 가시성 확인이 간헐 실패했다.
- 반영 파일
  - `src/components/upload/HighlightSuggestionReview.tsx`
  - `src/app/p/[handle]/client.tsx`
- 복구 방식
  - 저장 성공 후 `/profile?saved=featured`로 리다이렉트해 직전 저장 맥락을 전달
  - 프로필 화면에서 `saved=featured` query를 감지하면 `대표 영상으로 저장했어요.` 확인 배너를 즉시 노출
- 확인 포인트
  - single-clip 저장 직후 프로필 진입 시 저장 완료 신호가 즉시 보여야 함
  - 기존 대표 영상 리스트/탭 동작은 변경하지 않아야 함
  - playback contract, 저장 payload, 편집 기능 범위는 건드리지 않아야 함
- 검증
  - `npm run lint` → 통과 (`65 warnings`)
  - `npm run typecheck` → 통과
  - `npm run test:run` → 통과 (`8 files / 53 tests`)
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' -g '저장하면 프로필 대표 영상에 반영된다'` → `1 passed`

## 이번 단계에서 건드리지 않은 영역
- upload-store 구조 개편
- cleanup 대수술
- render 관련 복귀 작업
