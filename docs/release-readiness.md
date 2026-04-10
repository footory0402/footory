# Footory 영상 기능 Release Readiness

> Last checked: 2026-04-10
> 판단 기준: 실제 코드, 실제 라우트, 현재 테스트 결과

## 결론
- 현재 상태는 `shipping ready 아님`이다.
- 이유는 핵심 clip-first 흐름이 완전히 없는 것이 아니라, 실제 사용자 데이터와 상태를 깨뜨릴 수 있는 blocker가 남아 있기 때문이다.
- 이번 기준에서 기존 shipping blocker 3건은 해소 상태로 정리됐다.
- 다만 작은 화면/느린 네트워크/부분 성공 안내 같은 중요 회귀 검증 공백이 남아 있어 `shipping ready` 판정은 보류한다.

## 현재 가능한 것
- `/upload`는 선수/부모 권한에서만 진입 가능하고, 파일 형식/크기/길이 제한을 먼저 보여 준다.
  `src/app/upload/page.tsx`, `src/components/upload/SelectView.tsx`
- 파일 선택 후 `select -> processing -> review` 3단계로 이동하고, 실제 업로드가 processing 진입 시 시작된다.
  `src/app/upload/page.tsx:50-55`
- 업로드 후 single clip review에서 trim, spotlight freeze, zoom, overlay, highlight range를 조정할 수 있다.
  `src/components/upload/HighlightSuggestionReview.tsx:229-560`
- 저장 시 `clips` 레코드에 trim/highlight/spotlight/freeze/effects를 직접 반영하고, featured 또는 tag portfolio에 연결할 수 있다.
  `src/lib/highlight-save.ts`, `src/app/api/clips/[id]/route.ts:130-207`, `src/app/api/featured/route.ts`
- 프로필 내부 재생기 `ClipPlayerSheet`는 spotlight, freeze, zoom, intro, lower third를 실제로 소비한다.
  `src/components/player/ClipPlayerSheet.tsx`
- 여러 clip을 고르는 reel draft 화면과 저장 API는 존재한다.
  `src/app/reel/create/page.tsx`, `src/app/api/highlights/route.ts`

## 아직 불안정한 것
- 작은 화면(320px 전후)과 지연 네트워크 smoke 근거는 확보됐지만, 장시간/복귀/단절 조건의 고강도 회귀는 아직 부족하다.
- featured 저장의 부분 성공/부분 실패는 사용자 신호를 보강했지만, API 레벨 원자성 자체는 여전히 보강 여지가 있다.

## 출시 전에 반드시 막아야 할 문제

### `Blocker`
- 현재 없음

### `Important but not blocker`
- featured 저장은 `PATCH /api/clips/[id]` 성공 후 `/api/featured`가 실패해도 clip 저장 성공을 유지하고, 프로필에서 재시도 안내 배너를 보여준다.
  `src/lib/highlight-save.ts`, `src/components/upload/HighlightSuggestionReview.tsx`, `src/app/p/[handle]/client.tsx`
- review 미리보기는 로컬 object URL 기준이고, 저장 직후 원격 재생 자산 자체를 검증하지 않는다.
  `src/app/upload/page.tsx:39-48`, `src/components/upload/SingleClipEditorPreview.tsx`
- 프로필 카드 preview는 review 화면의 `playerData`를 쓰지만, 실제 profile/player 재생은 `/api/player-card` 기반 카드 데이터를 다시 읽는다.
  `src/components/upload/HighlightSuggestionReview.tsx:481-489`, `src/lib/player-card-client.ts`, `src/app/api/player-card/route.ts`
- 모바일 작은 화면/지연 검증은 Desktop smoke 2건 + iPhone 15 지연 smoke 1건으로 기본 근거를 확보했다.
  `tests/e2e/video/video-upload-flow.spec.ts`, `tests/e2e/video/video-test-helpers.ts`

### `Nice to have`
- reel order editor의 transition 선택값은 저장 API에 반영되지 않는다.
  `src/components/reel/ClipOrderEditor.tsx`, `src/app/api/highlights/route.ts:132-151`
- lint는 통과하지만 React hook/ref 관련 경고가 많아 향후 재생 안정성 회귀를 부를 수 있다.

## 모바일 사용성 이슈
- upload review는 상단 tool pill 가로 스크롤, 본문 다중 패널, 하단 고정 CTA를 동시에 쓴다.
  `src/components/upload/HighlightSuggestionReview.tsx:219-229`, `src/components/upload/HighlightSuggestionReview.tsx:677-707`
- 현재 코드만 보면 작은 화면에서 완전히 깨진다는 증거는 없지만, 이 조합은 320px 전후에서 정보 밀도와 CTA 가림 위험이 있다.
- 이 위험은 일부 완화됐다. `tests/e2e/video/video-upload-flow.spec.ts`에 320px smoke가 추가됐지만, 고강도 모바일 회귀는 후속 보강이 필요하다.

## 느린 네트워크 / 긴 업로드 이슈
- background R2 업로드 대기는 35초로 끊기고, 이후 direct upload 폴백으로 넘어간다.
  `src/lib/upload-service.ts:625-646`, `src/lib/upload-service.ts:886-910`
- visibility 복귀 후 30초 stall 감지는 유지된다. reset/cancel abort 경로와 지연 스모크는 확인됐지만, 복귀/단절 혼합 회귀는 아직 없다.
  `src/lib/upload-service.ts:667-683`, `src/app/upload/page.tsx`
- 썸네일은 업로드 완료 후 백그라운드에서 별도로 올라가므로, 느린 네트워크에서는 저장 직후 thumbnail 부재 상태가 길어질 수 있다.
  `src/lib/upload-service.ts:1028-1033`, `src/lib/upload-service.ts:1227-1264`
- 지연 네트워크 smoke(`delayMs` 기반)는 Desktop/iPhone 15에서 통과했지만, 실제 단절/복구 상황 회귀는 추가 검증이 필요하다.

## 데이터 유실 가능성
- single-clip 편집값(trim/spotlight/freeze/zoom/overlay)의 `/upload`, `/edit/[clipId]` 재진입 복구 자체는 현재 통과 상태다.
- processing/review 중 reset은 이번 단계에서 실제 업로드 abort와 연결했다. 다만 해당 경로의 모바일 E2E 재검증은 아직 남아 있다.
- featured 저장 분기에서 후속 연결만 실패해도 사용자는 “전체 저장 실패”로 이해할 수 있다. 실제로는 clip 메타데이터 일부가 이미 저장됐을 가능성이 있다.

## 검증 결과
- `npm run lint`: 통과. 다만 warning 65개.
- `npm run typecheck`: 통과.
- `npm run test:run`: 통과. `8 files / 52 tests`.
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' -g '저장하면 프로필 대표 영상에 반영된다'`: `1 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '업로드 뒤 바로 편집에 들어갈 수 있다|/edit 재진입에서도 최근 single-clip draft를 복구한다|저장하면 프로필 대표 영상에 반영된다'`: `3 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='Desktop Chrome' --grep '320px 화면에서도 업로드 후 편집과 저장 버튼이 보인다|지연 네트워크 조건에서도 업로드 후 저장까지 완료된다'`: `2 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep 'iPhone 15 지연 조건에서도 업로드 후 저장까지 완료된다'`: `1 passed`
- `npx playwright test tests/e2e/video/video-upload-flow.spec.ts --project='iPhone 15' --grep '편집 값을 바꾸면|/edit 재진입'`: `2 passed`
- 비고: 이번 단계는 blocker 재정렬 문서 작업으로 제한해 `npm run test:video` 전체 재실행은 생략했다.

## 현재 분류 요약

### `Blocker`
- 현재 없음

### `Important but not blocker`
- featured 저장 API의 완전 원자성 미보장(사용자 안내는 보강됨)
- 로컬 preview와 원격 재생 자산 검증 분리
- review profile card preview와 실제 player-card 데이터 소스 차이
- 장시간 업로드/복귀/단절 조합 회귀 미검증

### `Nice to have`
- reel transition 저장 미지원
- lint warning 정리
