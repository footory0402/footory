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
  - 결과: 통과 (`66 warnings`)
- `npm run typecheck`
  - 결과: 통과
- `npm run test:run`
  - 결과: 통과 (`7 files / 49 tests`)

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
