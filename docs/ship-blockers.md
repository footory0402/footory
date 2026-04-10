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
  - 검증: `tests/e2e/video/video-upload-flow.spec.ts`에 `업로드 -> 편집 -> 값 변경 -> /upload 재진입 복구`, `/edit 재진입 복구` 시나리오를 추가했고 `npm run test:video`에서 통과했다.

## 우선순위 순서 (남은 3개)
1. share/reel/profile 간 single-clip playback contract 불일치 리스크
2. upload-store 레거시 필드 과다
3. upload-service / ParentQuickUpload 업로드 로직 중복

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

## Blocker 3. share/reel/profile playback contract 불일치
- 왜 blocker인가
  profile 내부 player와 share/reel 소비 경로의 playback 계약(spotlight/freeze/zoom/lower-third/profile-card) 정렬이 완전하지 않다.
- 사용자 영향
  upload/save에서 본 결과와 share/reel에서 본 결과가 달라질 수 있다.
- 이번 작업 상태
  `미해결` (범위 제한으로 미진행)

## Blocker 4. upload-store 레거시 필드 과다
- 왜 blocker인가
  store 상태가 현재 메인 clip-first 흐름에 비해 과도하게 넓어 reset, 저장 payload, 재생 소비 경로의 결합도를 높인다.
- 사용자 영향
  상태 전이 복잡도로 인해 회귀 시 영향 반경이 커지고, upload 흐름 안정성 보수가 느려진다.
- 이번 작업 상태
  `미해결` (구조 개편 금지 범위로 미진행)

## Blocker 5. upload-service / ParentQuickUpload 로직 중복
- 왜 blocker인가
  presign/direct upload/fallback/메타데이터 저장 경로가 분산되어 동일 수정이 여러 경로에 반복 반영되어야 한다.
- 사용자 영향
  업로드 안정성 수정 시 parent 경로와 일반 경로의 동작 불일치 위험이 남는다.
- 이번 작업 상태
  `미해결` (공통화 작업 금지 범위로 미진행)

## 이번 단계에서 건드리지 않은 영역
- share/reel/profile playback contract 대수술
- upload-store 구조 개편
- cleanup 대수술
- render 관련 복귀 작업
