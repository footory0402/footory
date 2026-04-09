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
