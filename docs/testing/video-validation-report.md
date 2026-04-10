# 영상 Validation Report

> 작성일: 2026-04-10  
> 범위: QA / validation only (새 기능 추가 없음)  
> 기준 문서:  
> - `docs/testing/video-highlight-acceptance.md`  
> - `docs/testing/playwright-scenarios.md`  
> - `docs/release-readiness.md`  
> - `docs/ship-blockers.md`  
> - `docs/video-product-decisions.md`

## 1) Acceptance Criteria 분류

### 통과
- `AC-01` 업로드 진입 가능
- `AC-02` 파일 제한 이해 가능
- `AC-09` trim 조정 가능
- `AC-11` highlight range 선택 저장 가능

### 부분 통과
- `AC-06` spotlight 적용 재생: profile player 소비 경로는 있으나 share/reel 계약 불일치 잔존
- `AC-07` zoom playback: core 경로 존재하나 spotlight/재생 경로 일관성 검증 공백
- `AC-10` spotlight/zoom/overlay 선택 편집: UI는 있으나 회귀 자동화 부족
- `AC-12` 저장 후 featured/portfolio 연결: 코드 경로 존재, end-to-end 증거 부족
- `AC-12A` single clip draft 저장/복구: draft API/복구 UI 존재, 업로드 중 이탈 복구는 제한
- `AC-12B` reel draft 저장/복구: draft 저장/복구는 있으나 길이 계산 계약 불일치
- `AC-12C` draft/published 구분: 상태 구분은 있으나 publish 후 소비 경로 일관성 검증 부족
- `AC-13` 저장 후 프로필 확인: player E2E가 seed 부재로 skip되어 자동화 증거 부족
- `AC-14` 실패 시 다음 행동: 일부 retry/reset 제공, 실패 단계별 복구 안내는 약함
- `AC-15` 처리 지연 대응: 단계 UI는 있으나 느린 네트워크 기준 검증 공백
- `AC-17` clip vs 편집 정보 구분: 저장 패널 카피와 metadata 계약은 유지

### 실패
- `AC-03` 유효 파일 선택 후 업로드 시작: iPhone 15 자동화에서 `/upload`가 `로딩 중...`에 머물러 파일 선택까지 진입 실패
- `AC-04` 처리 상태 이해 가능: 처리 단계 UI 자체는 코드에 있으나 모바일 실사용 자동화 진입 실패로 사용자 검증 실패
- `AC-05` 업로드 직후 재생 가능: review 진입 자동화 실패로 실사용 기준 검증 실패
- `AC-08` player card / lower third: profile card editor 자동 채움 테스트 실패로 신뢰성 미충족
- `AC-16` 작은 화면 핵심 조작: 모바일 우선 자동화 실패로 합격 판정 불가

### 집계
- 통과: 4
- 부분 통과: 11
- 실패: 5

## 2) Playwright 실행 결과 (자동화 가능한 시나리오)

실행일: 2026-04-10

1. `npx playwright test tests/e2e/upload-wizard.spec.ts --project='Desktop Chrome'`
- 결과: `10 passed, 1 failed`
- 실패: `bgm tracks have correct schema`
- 원인: 테스트는 camelCase(`r2Key`, `durationSec`) 기대, API 응답은 snake_case(`r2_key`, `duration_sec`)

2. `VIDEO_FILE=tests/fixtures/videos/test1.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
- 결과: `4 failed`
- 공통 실패 원인: 로그인 후 `/upload`에서 기대 UI 대신 `로딩 중...` 상태 지속, file input 미노출

3. `npx playwright test tests/e2e/video/profile-card-editor.spec.ts --project='iPhone 15'`
- 결과: `5 passed, 1 failed`
- 실패: `로그인 상태에서 프로필 자동 채움`
- 원인: `canvas`/`card template` 가시성 검증 실패

4. `npx playwright test tests/e2e/video/video-player.spec.ts --project='iPhone 15'`
- 결과: `5 skipped`
- 원인: 프로필 clip seed 부재 시 전체 skip

5. `npm run test:video`
- 결과: `5 passed, 1 failed, 9 skipped`
- 핵심: 영상 QA 게이트가 실제 배포 게이트 역할을 못 함(실패 + 대량 skip)

## 3) spotlight / zoom / lower third / publish / reel draft 실패 지점

- `spotlight`: profile player 경로는 소비하지만 share/reel 경로 계약 불일치로 “저장 결과와 공유 결과 동일성”이 깨질 수 있음
- `zoom`: zoom 설정/소비 코드는 존재하나 모바일 업로드 flow 자동화 실패로 실사용 검증 미완료
- `lower third`: 토글 경로는 있으나 profile-card 자동 채움 실패가 연결되어 노출 신뢰도 저하
- `publish`: single clip publish/draft 상태는 존재하지만 publish 후 share/reel 재생 계약 일관성 검증이 닫히지 않음
- `reel draft`: 저장/복구는 있으나 reel 길이 계산이 trim 결과가 아닌 `duration_seconds` 기준이라 사용자 판단과 실제 재생 길이 불일치

## 4) 실패 원인

- 모바일 실사용 경로(`/upload`)가 자동화 기준에서 초기 진입부터 막힘 (`로딩 중...` 고착)
- API 계약과 테스트 계약 불일치(`bgm` 응답 키)
- 영상 핵심 E2E가 실패/skip 혼합 상태라 release gate 신뢰도 부족
- share/reel playback 계약 불일치, reel duration 계산 불일치 같은 제품 핵심 정합성 이슈 지속

## 5) 모바일 문제

- iPhone 15 기준 `/upload` 진입 후 파일 선택 UI 도달 실패 (`video-upload-flow` 4/4 실패)
- 작은 화면 핵심 조작 가능 여부를 자동화로 통과시키지 못해 `AC-16` 실패

## 6) 느린 네트워크 문제

- 느린 네트워크 전용 Playwright 시나리오가 현재 없음
- background upload 대기/폴백/stall 대응은 코드에 있으나 “사용자 체감 기준” 자동화 증거 없음

## 7) 데이터 유실 문제

- 업로드 중 reset/cancel은 이번 단계에서 foreground/background 업로드 abort로 연결됐다.
- 다만 모바일 video E2E 재검증을 이번 단계에서 다시 실행하지 않아, 실사용 시나리오 기준의 자동화 증거는 추가 확보가 필요하다.
- 업로드 이전 단계 이탈 시 원본 파일 자체는 복구되지 않음
- reel autosave 실패는 `catch`에서 silent 처리되어 사용자에게 손실 신호가 약함

## 8) Shipping Blocker 재평가

- 재평가 결론: `shipping ready 아님` 유지
- `업로드 중 reset/cancel 원자성`은 이번 코드 수정으로 해결 상태로 전환
- `src/app/api/video-projects/route.ts` 타입 오류 3건도 해결되어 typecheck 실패 원인에서 제거
- 다만 shipping blocker는 여전히 남아 있음: `share/reel/profile playback contract`, `upload-store 레거시 필드 과다`, `upload-service/ParentQuickUpload 중복`

## 9) 지금 가장 먼저 고쳐야 하는 문제 1개

- **share/reel/profile 간 single-clip playback contract 정렬**
- 이유: 업로드 저장 결과와 공유/소비 결과의 일관성을 깨뜨리는 남은 최상위 사용자 체감 리스크이기 때문

## 10) blocker 1/2 수정 후 검증 기록 (2026-04-10)

실행 커맨드(반복 실행 포함):
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`

결과:
- `npm run lint`: 통과(경고 67개)
- `npm run typecheck`: 통과
- `npm run test:run`: 통과 (`12 files / 68 tests`)

비고:
- 이번 작업 범위는 상위 2개 blocker 해결과 기본 회귀 검증으로 제한했다.
- `test:video`와 Playwright 재실행은 이번 단계 범위에서 제외되어, 기존 모바일 video E2E 실패/skip 상태 자체는 아직 유지된다.

## 11) blocker 0 업로드 후 편집 진입 복구 검증 (2026-04-10)

### 수정 대상
- `src/components/upload/UploadProcessingView.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `src/app/api/clips/[id]/route.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 막힌 원인
- 실제 processing 화면 완료 CTA가 `다른 파일 선택`뿐이라 업로드 직후 편집 route 진입 경로가 없었다.
- `/edit/[clipId]`는 살아 있었지만 현재 single-clip 편집 UI와 연결되지 않아 업로드 결과를 들고 이어서 편집할 수 없었다.

### 복구 결과
- 업로드 완료 후 `편집 화면으로 이동` CTA가 노출된다.
- CTA는 `/edit/[clipId]?from=upload&projectId=...` 형식으로 진입한다.
- `/edit/[clipId]`는 single-clip 편집 UI를 직접 렌더링하고, 로컬 파일 또는 `/api/clips/[id]` 응답으로 draft를 복원한다.

### Playwright smoke
- 실행 커맨드:
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts -g '업로드 완료 후 편집 route로 진입할 수 있다' --project='Desktop Chrome'`
- 결과:
  - `1 passed`
- 검증 범위:
  - clip 선택
  - 업로드 완료 상태에서 `편집 화면으로 이동` CTA 노출
  - CTA 클릭 후 `/edit/[clipId]` 진입
  - `single-clip-editor` 렌더 확인

### 기본 검증
- `npm run lint`: 통과 (`67 warnings`)
- `npm run typecheck`: 통과
- `npm run test:run`: 통과 (`12 files / 68 tests`)

### 비고
- 이번 단계는 blocker 0 복구만 다뤘고, share/reel playback contract, upload-store 구조, publish/profile 연결 등 다른 blocker는 의도적으로 제외했다.

## 12) 업로드 진행 표현 및 단일 편집 UX 단순화 검증 (2026-04-10)

### 수정 대상
- `src/app/upload/page.tsx`
- `src/components/upload/SelectView.tsx`
- `src/components/upload/UploadProcessingView.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/components/upload/SingleClipEditorPreview.tsx`
- `src/lib/video-projects.ts`
- `src/lib/highlight-save.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`
- `tests/e2e/video/profile-card-editor.spec.ts`

### 사용자 관점에서 정리한 문제
- 업로드 진행 화면이 `1/2/3` 세로 나열 중심이라 지금 무엇을 기다리는지 파악하기 어려웠다.
- 업로드 직후 행동이 `편집` 하나로 기울어 있어, 바로 저장하려는 사용자 의도가 막혔다.
- 단일 영상 편집 화면은 설명 문구와 패널이 많아 작은 화면에서 정작 영상이 거의 보이지 않았다.
- `video_projects` 저장소가 없는 환경에서 raw 에러가 노출돼 초반 신뢰감을 떨어뜨렸다.

### 반영 결과
- 업로드 중 상태는 `영상 확인 → 올리는 중 → 저장 선택` 연결형 진행 표시로 축약했다.
- 업로드 완료 후 `이대로 저장` / `편집하고 저장` 두 갈래로 바로 선택할 수 있게 바꿨다.
- 편집 화면은 `구간 / 주인공 / 정보 / 저장` 4단계로 정리하고, 저장 패널은 마지막 단계에만 보이도록 줄였다.
- 편집 미리보기에서는 큰 HUD/문구를 걷어내고 영상 본체와 안전 영역 가이드만 남겼다.
- 상시 설명 카드 대신 1회성 온보딩 힌트로 전체 순서와 `주인공` 단계 탭 동작만 짧게 안내한다.
- `video_projects` 테이블이 없는 경우 draft sync를 조용히 비활성화하고, 저장은 계속 진행되도록 처리했다.

### Playwright MCP 수동 점검
- 사용 파일: `tests/fixtures/videos/test2.mp4`
- 확인 흐름:
  - 로그인 → `/upload` 진입
  - 파일 선택 → trim 확인 → 업로드 시작
  - 업로드 완료 후 `이대로 저장` / `편집하고 저장` 노출 확인
  - 편집 진입 후 `구간`, `주인공`, `정보`, `저장` 각 단계 직접 조작
  - 직접 저장 경로와 편집 후 저장 경로 각각 확인
- 관찰 결과:
  - 업로드 직후 의사결정이 한 화면에서 끝나 사용자 판단이 빨라졌다.
  - 편집 화면에서 비디오 가시 면적이 확실히 커졌고, 하단 단계 구조가 더 이해하기 쉬워졌다.
  - 새로고침 후 최근 콘솔 기준 `/upload` 화면에서 fresh error는 재현되지 않았다.

### 자동화 검증
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='Desktop Chrome'`
  - 결과: `6 passed`
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `6 passed`
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npm run test:video`
  - 결과: `12 passed, 5 skipped`
  - 비고: `video-player.spec.ts` 5건은 기존과 동일하게 clip seed 부재로 skip
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`7 files / 49 tests`)

## 13) `/upload` bare route 로딩 고착 복구 검증 (2026-04-10)

### 수정 대상
- `src/providers/ProfileProvider.tsx`
- `src/app/upload/page.tsx` 영향 경로 확인

### 막힌 원인
- `/upload`는 `AppShell`의 bare route 분기에서 `ProfileProvider`만 감싼다.
- 그런데 `ProfileProvider`는 `ProfileHydrator`가 주입되는 경로에서만 `loading`을 해제하고, bare route 자체 초기 fetch는 하지 않았다.
- 그 결과 `/upload` 진입 시 `useProfileContext()`가 `loading=true`, `profile=null`에 고정되며 `로딩 중...` 화면에 머무를 수 있었다.

### 복구 결과
- `ProfileProvider`가 mount 직후 지연된 초기 fetch를 수행해 bare route에서도 프로필을 읽어 온다.
- `ProfileHydrator`가 있는 경로는 같은 mount cycle에서 먼저 hydrate되므로 기존 hydrate 우선 경로를 유지한다.
- `/upload` 직접 진입과 fixture smoke 기준에서 파일 선택 UI 노출이 다시 확인됐다.

### 검증 결과
- `npm run lint`: 통과 (`65 warnings`)
- `npm run typecheck`: 통과
- `npm run test:run`: 통과 (`7 files / 49 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
  - 확인 범위: `/upload` 직접 진입, fixture 비디오 선택 화면 노출, 업로드 후 편집 진입, draft 복구, 프로필 저장

### 비고
- 이번 단계는 업로드 진행 표현과 single-clip 편집 UX 단순화에 한정했다.
- share/reel/profile playback contract 정렬, upload-store 구조 축소, 업로드 서비스 중복 제거는 여전히 다음 단계 과제로 남는다.
- 후속 보정으로 편집 단계 설명을 더 짧게 줄이고, 하단 액션 바 보조 버튼 최소 너비와 safe area 여백을 늘려 작은 화면 안정성을 다시 확인했다.
- 추가 후속 보정으로 상시 문구 일부를 1회성 온보딩 힌트로 옮겨, 첫 사용자 안내와 상시 화면 밀도를 분리했다.

## 13) fixture 기반 영상 핵심 E2E 상시 실행 복구 (2026-04-10)

### fixture 전략
- 기본 영상 fixture는 `tests/fixtures/videos/test2.mp4`를 사용한다.
- `VIDEO_FILE`은 더 큰 샘플이나 수동 검증이 필요할 때만 override 용도로 유지한다.
- 핵심 helper는 `tests/e2e/video/video-test-helpers.ts`에 두고, upload/publish/draft/featured API를 context route 모킹으로 묶어 새 탭 재진입까지 같은 상태로 재현한다.
- fixture 비디오는 `/__e2e__/fixture-video.mp4`로 서빙해 `/edit/[clipId]` 재진입과 프로필 플레이어 경로에서 같은 파일을 다시 소비한다.

### 이번 단계에서 상시 실행 가능해진 핵심 시나리오

## 14) blocker 8 저장 후 프로필 반영 확인 안정화 (2026-04-10)

### 수정 대상
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/app/p/[handle]/client.tsx`

### 문제와 조치
- 문제: 저장 직후 프로필 진입에서 반영 확인 신호가 약해 `저장 실패`로 오해할 수 있었고, 관련 E2E가 간헐 실패했다.
- 조치: 저장 성공 시 `/profile?saved=featured`로 이동하고, 프로필에서 `saved=featured`를 감지하면 `대표 영상으로 저장했어요.` 배너를 즉시 노출하도록 최소 보정했다.

### 사용자 플로우 점검 포인트
- `/upload`에서 single-clip 저장 완료 후 `/profile`로 이동했을 때 즉시 저장 완료 배너가 보이는지
- 프로필 대표 영상 탭/목록 동작은 기존과 동일한지
- 저장 직후 재생기 진입 및 대표 영상 텍스트 노출 확인이 안정적인지

### 검증 결과
- `npm run lint`: 통과 (`65 warnings`)
- `npm run typecheck`: 통과
- `npm run test:run`: 통과 (`8 files / 53 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' -g '저장하면 프로필 대표 영상에 반영된다'`: `1 passed`

## 14) single-clip draft 복구 + playback contract 정렬 검증 (2026-04-10)

### 수정 대상
- `src/lib/single-clip-playback.ts`
- `src/lib/video-projects.ts`
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `src/app/p/[handle]/page.tsx`
- `src/app/p/[handle]/client.tsx`
- `src/app/p/[handle]/h/[clipId]/page.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/[id]/page.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`
- `src/app/api/highlights/[id]/route.ts`
- `src/components/profile/HighlightsTabV5.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/__tests__/single-clip-playback.test.ts`
- `tests/e2e/video/video-test-helpers.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`
- `tests/e2e/video/video-player.spec.ts`

### 이번 단계에서 닫힌 범위
- single-clip draft 저장/복구 기준값을 `/upload`와 `/edit/[clipId]`에서 같은 payload로 복구
- profile/share/reel single-clip 소비 경로가 trim 우선 duration과 playback metadata를 같은 builder로 읽도록 정렬
- editor autosave/save가 최신 store draft를 기준으로 저장되도록 보정

### 저장/복구 확인값
- 저장/복구 통과:
  - `trimStart`, `trimEnd`
  - `highlightStart`, `highlightEnd`
  - `freezeAt`
  - `zoom`
  - `overlay.showLowerThird`
  - `saveTarget.profileTarget`
- 현재 payload에 포함되지만 public E2E gate로 아직 닫지 못한 값:
  - `overlay.showProfileCard`
  - public profile/share/reel 소비 결과 전체

### 실행 결과
- `npm run lint`
  - 통과 (`65 warnings`)
- `npm run typecheck`
  - 통과
- `npm run test:run`
  - 통과 (`8 files / 52 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
- `npm run test:video`
  - 결과: `10 passed, 4 failed`
  - 잔여 실패:
    - `tests/e2e/video/profile-card-editor.spec.ts:35`
    - `tests/e2e/video/video-player.spec.ts:5`
    - `tests/e2e/video/video-player.spec.ts:19`
    - `tests/e2e/video/video-player.spec.ts:58`

### 남은 해석
- `video-upload-flow.spec.ts`는 single-clip draft 재진입 복구를 iPhone 15 기준으로 닫았다.
- 반면 `video-player.spec.ts`는 public profile/reel SSR seed가 없는 상태에서 브라우저 route mock만으로는 profile featured/reel UI를 안정적으로 만들지 못해 아직 release gate로 쓰기 어렵다.
- `profile-card-editor.spec.ts` 비로그인 공개 진입 실패도 여전히 전체 `npm run test:video`를 막는다.
- `tests/e2e/video/video-upload-flow.spec.ts` `업로드 뒤 바로 편집에 들어갈 수 있다`
- `tests/e2e/video/video-upload-flow.spec.ts` `편집 값을 바꾸면 draft가 저장되고 다시 들어와 복구할 수 있다`
- `tests/e2e/video/video-upload-flow.spec.ts` `저장하면 프로필 대표 영상에 반영된다`
- `tests/e2e/video/video-player.spec.ts` `프로필 대표 영상에서 플레이어를 열 수 있다`
- `tests/e2e/video/video-player.spec.ts` `프로필 반영된 영상은 trim과 spotlight 정보를 소비한다`

### 더 이상 `VIDEO_FILE` 또는 clip seed 때문에 skip되지 않는 테스트
- `tests/e2e/video/video-upload-flow.spec.ts` 전체 4개
- `tests/e2e/video/video-player.spec.ts` 전체 2개

### Playwright 실제 실행 결과
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `4 passed`
- `npx playwright test tests/e2e/video/video-player.spec.ts --project='iPhone 15'`
  - 결과: `2 passed`
- `npm run test:video`
  - 결과: `12 passed, 0 skipped`

### 기본 검증 결과
- `npm run lint`
  - 결과: 통과 (`66 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`7 files / 49 tests`)

### 판정 메모
- 영상 핵심 happy path 3종은 이제 fixture 기반으로 iPhone 15에서 항상 재현 가능하다.
- 기존 `video-player.spec.ts`의 seed 의존 skip은 제거됐다.
- 이번 단계는 fixture 회귀 안정화에 한정했으므로, 실패/지연 전용 시나리오와 share/reel 계약 정렬은 별도 후속 작업으로 남는다.

## 14) single-clip 편집 저장/복구 안정화 검증 (2026-04-10)

### 범위
- single-clip 편집 화면에서 실제 UI로 바꿀 수 있는 값만 저장/복구 대상으로 재검증
- reel highlight, publish/profile 확장, cleanup 확대는 이번 단계 범위에서 제외

### 이번 단계에서 저장/복구 확인한 값
- `playback.trimStart`
- `playback.freezeAt`
- `playback.zoom`
- `overlay.showProfileCard`
- `overlay.showLowerThird`
- `playback.highlightStart`
- `playback.highlightEnd`
- `saveTarget.profileTarget`

### 구현 보정 결과
- `/upload`의 `최근 편집 이어서 하기`는 draft payload를 store primitive와 `editorDraft`에 함께 주입해 trim/spotlight/freeze/zoom/overlay 기준이 한 경로로 복구된다.
- `/edit/[clipId]`는 latest single-clip draft를 `clipId` 기준으로 먼저 조회하고, draft가 있으면 clip metadata보다 draft payload를 우선 복원한다.
- direct route 재진입에서도 unpublished draft 편집값이 유지된다.

### Acceptance 반영
- `AC-12A` single clip draft 서버 저장/복구: `부분 통과 -> 통과`
- `AC-10` spotlight/zoom/overlay 선택 편집: trim 외 focus/overlay 복구 자동화가 추가돼 `부분 통과` 근거 강화
- `AC-17` clip vs 편집 정보 구분: `/edit/[clipId]` direct 재진입에서도 draft payload 우선 복구가 확인돼 유지

### Playwright 실제 실행 결과
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
  - 추가 검증:
    - `업로드 -> 편집 -> 값 변경 -> /upload 재진입 -> 복구`
    - `업로드 -> 편집 -> 값 변경 -> /edit/[clipId] 재진입 -> 복구`
- `npm run test:video`
  - 결과: `13 passed`

### 기본 검증 결과
- `npm run lint`
  - 결과: 통과 (`66 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`7 files / 49 tests`)

### 남은 blocker 메모
- 이번 단계로 single-clip draft 저장/복구 자체는 blocker에서 해소
- 남은 최상위 blocker는 여전히 `share/reel/profile playback contract`, `upload-store 레거시 필드`, `upload-service 중복`

## 15) single-clip 편집 후속 UX 보정 검증 (2026-04-10)

### 사용자 피드백 기준 보정 항목
- 구간 편집은 시작/끝을 각각 따로 움직이는 대신 한 줄 range에서 함께 잡히게 바꿨다.
- `주인공` 단계에서는 정지 상태 재생 아이콘이 중앙을 가리지 않게 제거하고, focus 단계 진입 시 자동 일시정지되게 맞췄다.
- `고정 시점`은 슬라이더 대신 `지금 장면 고정` 행동으로 단순화했다.
- 프로필 카드는 다시 기본 고정 요소로 올리고, 편집 화면에서 항상 켜짐으로 처리했다.
- 마지막 저장 단계의 하이라이트는 기본 저장과 분리해 "대표 장면만 짧게 다시 보여주기" 선택형으로 낮췄다.
- 최종 저장 후에는 편집 화면에 머무르지 않고 `/profile`로 이동하도록 바꿨다.

### 반영 파일
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/components/upload/SingleClipEditorPreview.tsx`
- `src/lib/single-clip-playback.ts`
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `tests/e2e/video/video-upload-flow.spec.ts`

### Playwright 검증
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='Desktop Chrome'`
  - 결과: `5 passed`
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
- `VIDEO_FILE=tests/fixtures/videos/test2.mp4 npm run test:video`
  - 결과: `13 passed`

### 기본 검증 결과
- `npm run lint`
  - 결과: 통과 (`67 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`7 files / 49 tests`)

### 판정 메모
- `구간` 단계는 현재 선택 범위를 한 번에 읽을 수 있게 됐고, `주인공` 단계는 실제 탭 대상이 가려지지 않는다.
- 프로필 카드는 single-clip 편집 기준에서 다시 항상 노출되는 방향으로 고정됐다.
- 마지막 저장은 "옵션 조정 -> 저장 -> 프로필 이동"으로 닫혀, 저장 뒤 멈춰 있는 흐름이 제거됐다.

## 16) 프로필 카드 설정 상단 복구 및 재생 시작 비차단화 검증 (2026-04-10)

### 수정 대상
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/lib/single-clip-playback.ts`
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `src/components/player/ClipPlayerSheet.tsx`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 반영 내용
- 편집 화면 상단에 `선수 프로필 카드` 설정을 다시 노출했다.
- 카드 on/off는 draft에 저장되고 `/upload`, `/edit/[clipId]` 재진입 시 복구된다.
- 실제 플레이어의 intro 카드는 전체 화면 블로킹 대신 상단 safe area 안의 짧은 오버레이로 줄였다.
- intro 표시 중에도 비디오 자체는 가리지 않게 바꿔 앞부분이 잘린 것처럼 보이는 체감을 줄였다.

### 검증 결과
- `npm run lint`: 통과 (`65 warnings`)
- `npm run typecheck`: 통과
- `npm run test:run`: 통과 (`8 files / 52 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
  - 확인 범위: 상단 프로필 카드 설정 노출, draft 저장/복구, `/edit/[clipId]` 재진입 복구, 업로드 후 저장

### 추가 메모
- `tests/e2e/video/video-player.spec.ts --project='iPhone 15'`는 이번 변경과 직접 무관한 프로필/릴 목록 mock 가시성 문제로 별도 실패 상태였다.
- 이번 단계 보고에서는 사용자 요청 범위와 직접 맞닿은 업로드 편집 진입 및 draft 복구 E2E를 통과 기준으로 남긴다.

## 17) video Playwright 게이트 안정화 후 재검증 (2026-04-10)

### 반영 대상
- `tests/e2e/video/video-player.spec.ts`
- `tests/e2e/video/profile-card-editor.spec.ts`
- `src/components/profile/HighlightsTabV5.tsx`

### 정렬 내용
- `video-player.spec.ts`를 공개 프로필 SSR seed 가정에서 로그인 기반 owner 경로 + mock API 소비 경로로 정렬했다.
- 릴 카드 검증은 실제 UI에서 안정적으로 보장되는 값(릴 카드 trim 기반 길이 + 재생 진입) 중심으로 고정했다.
- `profile-card-editor.spec.ts` 비로그인 케이스를 현재 인증 정책(`/editor` 접근 시 `/login` 이동)과 일치시켰다.
- owner 프로필 하이라이트 탭은 `/api/highlights`를 재조회해 SSR 초기값과 client 상태를 동기화하도록 맞췄다.

### 실행 결과
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`8 files / 52 tests`)
- `npx playwright test tests/e2e/video/video-player.spec.ts --project='iPhone 15'`
  - 결과: `3 passed`
- `npx playwright test tests/e2e/video/profile-card-editor.spec.ts --project='iPhone 15'`
  - 결과: `6 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
- `npm run test:video`
  - 결과: `14 passed`

### 판정
- 영상 E2E 게이트는 현재 기준에서 실패/skip 없이 닫혔다.
- 남은 ship blocker는 영상 재생 정합성 이슈가 아니라 `upload-store` 구조 과다와 업로드 로직 중복이다.

## 18) single-clip 저장/복구 2차 안정화 검증 (2026-04-10)

### 수정 대상
- `src/lib/single-clip-store-sync.ts` (신규)
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 안정화 내용
- `/upload`와 `/edit/[clipId]`가 draft payload를 업로드 스토어에 주입할 때 같은 동기화 유틸을 사용하도록 정렬했다.
- 저장/복구 기준을 single-clip 편집 실사용 값 중심으로 고정했다:
  - trim: `trimStart`, `trimEnd`
  - spotlight: `spotlight.x`, `spotlight.y`
  - zoom/freeze: `zoom`, `freezeAt`
  - player info overlay: `overlay.showProfileCard`, `overlay.showLowerThird`
- E2E 플래키 원인이던 온보딩 가이드 오버레이 간섭을 시나리오에서 흡수했다(`닫기` 처리 + spotlight/freeze 즉시 검증).

### 실행 결과
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`8 files / 52 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `5 passed`
- `npm run test:video`
  - 결과: `14 passed`

### 판정
- 사용자 흐름 `업로드 -> 편집 -> 값 변경 -> 저장 -> 재진입(/upload, /edit)`에서 single-clip draft 복구가 안정적으로 재현된다.
- 이번 단계 비범위였던 `reel highlight 확장`, `publish/profile 확장`, `cleanup 확대`는 미진행 상태로 유지했다.

## 19) blocker 5 단일 마무리 검증 (2026-04-10)

### 이번 턴 고정 범위
- blocker 1개만 마무리: `single-clip draft store 동기화 경로 최소 정렬`
- 비범위: 새 기능 추가, cleanup 확대, playback contract 대수술, 다른 blocker 착수

### 반영 코드 경로
- `src/lib/single-clip-store-sync.ts`

## 20) `/upload` 메인 프로필 카드 편집기 복구 검증 (2026-04-10)

### 수정 대상
- `src/components/upload/SelectView.tsx`
- `src/components/upload/UploadProfileCardEditor.tsx`
- `src/lib/player-card-editor.ts`
- `src/app/editor/page.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/stores/upload-store.ts`
- `tests/e2e/video/video-test-helpers.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`
- `src/__tests__/upload-store.test.ts`

### 반영 내용
- `/upload` 파일 선택 직후 화면에 축약 프로필 카드 편집기와 `카드 저장` 버튼을 추가했다.
- 카드 로드/저장 fetch 로직은 `player-card-editor` 공용 유틸로 묶어 `/upload`와 `/editor`가 같은 payload 계약을 사용하게 맞췄다.
- 업로드 후 편집 화면의 프로필 카드 영역은 카드 내용 편집이 아니라 `이 영상을 시작할 때 카드를 넣을지`만 고르는 단계로 정리했다.
- 새 업로드의 `effects.intro` 기본값을 `true`로 올려, 업로드 후 편집에서는 항상 카드 포함 상태로 시작하게 맞췄다.
- Playwright helper는 `편집하고 저장` 클릭 후 `/edit/[clipId]` 진입과 editor 노출까지 기다리도록 보강해 플로우 회귀를 안정화했다.

### 실행 결과
- `npm run lint`
  - 결과: 통과 (`66 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`9 files / 57 tests`)
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `6 passed`
  - 추가 확인:
    - `/upload`에서 프로필 카드 이름/팀/등번호/포지션/테마 저장
    - 업로드 후 편집 화면의 카드 포함 기본값 `보임`
    - draft 저장/복구 시 카드 포함 상태 `보임` 유지

### 메모
- 새 프로필 카드 편집기 추가 후에도 `lint` 경고 수는 기존과 같은 `65 warnings`로 유지했다.
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 필수 검증 결과
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`8 files / 52 tests`)

### Playwright smoke
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15'`
  - 결과: `4 passed, 1 failed`
  - 실패: `저장하면 프로필 대표 영상에 반영된다`에서 `대표 영상` 텍스트 미노출
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '편집 값을 바꾸면|/edit 재진입'`
  - 결과: `2 passed`
  - 해석: blocker 5 대상인 draft 저장/복구 및 `/edit` 재진입 동기화 경로는 통과

### 판정
- blocker 5 범위(단일 clip draft 동기화)는 이번 턴에서 마무리했다.
- profile 대표 영상 표시 검증 실패 1건은 별도 흐름 이슈로 남기고, 남은 blocker 우선순위는 `upload-store 레거시 필드 과다`, `upload-service / ParentQuickUpload 중복`을 유지한다.

## 20) blocker 1 upload-store 레거시 상태 경계 축소 검증 (2026-04-10)

### 이번 턴 고정 범위
- 해결 대상 blocker 1개: `upload-store 레거시 필드 과다`
- 비범위: upload-service/ParentQuickUpload 공통화, playback contract 변경, 대규모 cleanup

### 수정 대상
- `src/stores/upload-store.ts`
- `src/__tests__/upload-store.test.ts`

### 반영 내용
- `setFile` 경로를 clip-first 기준으로 재정렬했다.
  - 파일 교체 시 레거시 상태(`eventTag`, `tracking*`, `skill/custom labels`, `slowmo`, `bgm`, `compress`, `r2*`)를 기본값으로 초기화.
  - 업로드 경로 컨텍스트(`context`)와 parent/challenge 식별자(`child*`, `challengeTag`)는 유지.
- 단위 테스트를 추가해 새 파일 선택 시 "레거시 필드 초기화 + 컨텍스트 유지"를 검증했다.

### 사용자 플로우 수동 점검 포인트
- `/upload`에서 파일을 다시 고르면 이전 업로드의 레거시 설정이 다음 파일에 누수되지 않아야 한다.
- parent 업로드에서 파일을 다시 골라도 child 문맥이 유지되어야 한다.
- 파일 선택 후 `select -> processing -> review` 전환이 기존과 동일해야 한다.

### 실행 결과
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`8 files / 53 tests`)
- Playwright smoke
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep 'fixture 비디오로 업로드 선택 화면을 항상 열 수 있다|업로드 뒤 바로 편집에 들어갈 수 있다'`
  - 결과: `2 passed`

### 판정
- blocker 1의 핵심 원인이던 `새 파일 선택 시 레거시 상태 누수`는 이번 범위에서 닫혔다.
- 남은 blocker는 `upload-service / ParentQuickUpload 업로드 로직 중복`, `저장 후 프로필 대표 영상 반영 확인 불안정`이다.

## 21) blocker 2 parent/general 업로드 경로 중복 축소 검증 (2026-04-10)

### 이번 턴 고정 범위
- 해결 대상 blocker 1개: `upload-service / ParentQuickUpload 업로드 로직 중복`
- 비범위: 업로드 payload 계약 변경, API 스키마 변경, 프로필 반영 로직 수정

### 수정 대상
- `src/components/parent/ParentQuickUpload.tsx`

### 반영 내용
- `ParentQuickUpload`의 자체 presign/R2/클립저장 구현을 제거했다.
- parent 업로드가 공용 서비스 함수 `startUpload`를 호출하도록 정렬했다.
- 업로드 완료/실패 표시(`done`, `error`)는 기존 컴포넌트 UI 흐름을 유지했다.

### 사용자 플로우 수동 점검 포인트
- 부모가 자녀 선택 후 업로드를 시작하면 일반 `/upload`와 동일 서비스 경로로 업로드가 진행되어야 한다.
- 업로드 성공 시 완료 모달이 기존처럼 보여야 한다.
- 업로드 실패 시 기존 오류 문구 영역에 메시지가 노출되어야 한다.

### 실행 결과
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`8 files / 53 tests`)
- Playwright smoke
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '업로드 뒤 바로 편집에 들어갈 수 있다|fixture 비디오로 업로드 선택 화면을 항상 열 수 있다'`
  - 결과: `2 passed`

### 판정
- parent/general 업로드 경로 분산 구현을 줄여 동일 수정의 동기화 리스크를 완화했다.
- 남은 최상위 blocker는 `저장 후 프로필 대표 영상 반영 확인 불안정` 1개다.

## 22) 병렬 lane 전환 라운드 검증 (2026-04-10)

### Lane A (Core Fix) 범위
- `publish/profile` 1개 흐름만 수정
- 수정 파일:
  - `src/lib/highlight-save.ts`
  - `src/components/upload/HighlightSuggestionReview.tsx`
  - `src/app/p/[handle]/client.tsx`
- 반영 내용:
  - clip 저장 성공 + featured 연결 실패를 전체 실패로 처리하지 않고 부분 성공으로 분리
  - 저장 직후 이동 경로를 `saved=featured` / `saved=clip`으로 구분해 프로필 배너에서 상태를 명확히 안내

### Lane B (QA / Playwright) 범위
- 코드 기능 확장 없이 smoke/validation만 수행
- 실행 커맨드:
  - `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '업로드 뒤 바로 편집에 들어갈 수 있다|/edit 재진입에서도 최근 single-clip draft를 복구한다|저장하면 프로필 대표 영상에 반영된다'`
- 결과:
  - `3 passed`
  - 검증된 플로우:
    - 업로드 → 편집
    - 편집 → 저장 → `/edit` 재진입 복구
    - 편집 → 저장 → profile 반영 확인

### Lane C (UX / Copy Polish) 범위
- 이번 라운드는 코드 수정 없이 정리 범위만 고정
- 다음 라운드 대상:
  - `HighlightSuggestionReview`의 CTA/설명문 군더더기 축소
  - overlay safe area 안내 문구 단순화
  - 한국어 행동형 문구 통일

### 공통 검증
- `npm run lint` → 통과 (`65 warnings`)
- `npm run typecheck` → 통과
- `npm run test:run` → 통과 (`9 files / 57 tests`)

### 판정
- 데이터 계약에 닿는 수정은 Lane A 한 곳으로 제한됐고, QA는 별도 lane에서 병렬 검증으로 닫혔다.
- 이번 라운드에서 store/API/shared contract 대수술은 수행하지 않았다.

## 23) Lane C 문구/safe area 폴리시 정리 (2026-04-10)

### 범위
- 계약 수정 없이 편집 화면의 한국어 문구, CTA 보조 문구, safe area 안내만 정리
- 수정 파일:
  - `src/components/upload/HighlightSuggestionReview.tsx`
  - `src/components/upload/SingleClipEditorPreview.tsx`

### 반영 내용
- overlay 단계 안내를 행동 중심 문구로 축약
- 하단 정보 설명을 `하단 안전 영역` 기준으로 통일
- 미리보기 헬퍼 문구를 단계별 다음 행동 중심으로 단순화

### 비범위 확인
- `src/lib/*`, `src/stores/*`, `src/app/api/*` 변경 없음
- 저장 payload, draft sync, playback contract 변경 없음

## 24) Lane B 320px/지연 네트워크 스모크 확장 (2026-04-10)

### 범위
- 코드 기능 확장 없이 QA 시나리오 확장만 수행
- 수정 파일:
  - `tests/e2e/video/video-test-helpers.ts`
  - `tests/e2e/video/video-upload-flow.spec.ts`

### 반영 내용
- mock video flow helper에 API 지연 옵션(`delayMs`)을 추가해 느린 네트워크 조건을 재현할 수 있게 했다.
- video-upload-flow에 아래 smoke 2건을 추가했다.
  - `320px 화면에서도 업로드 후 편집과 저장 버튼이 보인다`
  - `지연 네트워크 조건에서도 업로드 후 저장까지 완료된다`

### 실행 결과
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='Desktop Chrome' --grep '320px 화면에서도 업로드 후 편집과 저장 버튼이 보인다|지연 네트워크 조건에서도 업로드 후 저장까지 완료된다'`
  - 결과: `2 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep 'iPhone 15 지연 조건에서도 업로드 후 저장까지 완료된다'`
  - 결과: `1 passed`
- `npm run lint`
  - 결과: 통과 (`65 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`9 files / 57 tests`)

### 해석
- 320px 근처 소형 화면에서 핵심 CTA 가시성은 smoke 기준으로 확인됐다.
- 지연 조건에서도 업로드→편집→저장→프로필 이동의 핵심 경로는 Desktop/iPhone 15 smoke 모두 유지됐다.
- 다만 장시간 업로드, 탭 전환/복귀, 네트워크 단절/복구 같은 고강도 실패 시나리오는 후속 검증 대상으로 남긴다.
