# Footory 영상 기능 Release Readiness

> Last checked: 2026-04-10
> 판단 기준: 실제 코드, 실제 라우트, 현재 테스트 결과

## 결론
- 현재 상태는 `shipping ready 아님`이다.
- 이유는 핵심 clip-first 흐름이 완전히 없는 것이 아니라, 실제 사용자 데이터와 상태를 깨뜨릴 수 있는 blocker가 남아 있기 때문이다.
- 이번 단계에서 업로드 reset/cancel 원자성과 `video-projects` route 타입 오류는 해결했지만, playback contract/상태 복잡도/업로드 경로 중복 리스크가 남아 있다.

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
- public share/reel 재생은 profile 내부 플레이어와 같은 overlay 계약을 쓰지 않는다.
  `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx:266-419`, `src/app/p/[handle]/h/[clipId]/page.tsx:99-170`, `src/app/reel/[id]/ReelShareClient.tsx`
- upload-store 레거시 필드 과다로 상태 전이/저장 payload/소비 경로 결합이 높다.
  `src/stores/upload-store.ts`, `docs/deletion-candidates.md`
- upload-service와 ParentQuickUpload 경로가 중복돼 동일 수정의 동기화 비용과 불일치 위험이 있다.
  `src/lib/upload-service.ts`, `src/components/parent/ParentQuickUpload.tsx`

## 출시 전에 반드시 막아야 할 문제

### `Blocker`
1. profile과 share/reel 재생 계약 불일치로 core playback 경험이 경로마다 다름
2. upload-store 레거시 필드 과다로 인한 상태 결합/회귀 위험
3. upload-service / ParentQuickUpload 업로드 로직 중복으로 인한 동기화 리스크

### `Important but not blocker`
- `test:video` 기준 실패/skip 혼합 상태는 여전히 release gate 신뢰도를 낮춘다.
- featured 저장은 `PATCH /api/clips/[id]` 성공 후 `/api/featured`가 실패하면 전체 저장 실패처럼 보이지만, clip 메타데이터는 이미 반영될 수 있다.
  `src/lib/highlight-save.ts:35-62`
- review 미리보기는 로컬 object URL 기준이고, 저장 직후 원격 재생 자산 자체를 검증하지 않는다.
  `src/app/upload/page.tsx:39-48`, `src/components/upload/SingleClipEditorPreview.tsx`
- 프로필 카드 preview는 review 화면의 `playerData`를 쓰지만, 실제 profile/player 재생은 `/api/player-card` 기반 카드 데이터를 다시 읽는다.
  `src/components/upload/HighlightSuggestionReview.tsx:481-489`, `src/lib/player-card-client.ts`, `src/app/api/player-card/route.ts`
- 모바일 작은 화면 전용 검증이 부족하다. 현재 비디오 E2E는 `iPhone 15`만 직접 돌고, 320px 근처 upload 시나리오는 없다.
  `playwright.config.ts`, `tests/e2e/video/video-upload-flow.spec.ts`

### `Nice to have`
- reel order editor의 transition 선택값은 저장 API에 반영되지 않는다.
  `src/components/reel/ClipOrderEditor.tsx`, `src/app/api/highlights/route.ts:132-151`
- lint는 통과하지만 React hook/ref 관련 경고가 많아 향후 재생 안정성 회귀를 부를 수 있다.

## 모바일 사용성 이슈
- upload review는 상단 tool pill 가로 스크롤, 본문 다중 패널, 하단 고정 CTA를 동시에 쓴다.
  `src/components/upload/HighlightSuggestionReview.tsx:219-229`, `src/components/upload/HighlightSuggestionReview.tsx:677-707`
- 현재 코드만 보면 작은 화면에서 완전히 깨진다는 증거는 없지만, 이 조합은 320px 전후에서 정보 밀도와 CTA 가림 위험이 있다.
- 이 위험은 현재 테스트로 닫혀 있지 않다. `tests/e2e/video/video-upload-flow.spec.ts`는 320px 케이스를 직접 검증하지 않는다.

## 느린 네트워크 / 긴 업로드 이슈
- background R2 업로드 대기는 35초로 끊기고, 이후 direct upload 폴백으로 넘어간다.
  `src/lib/upload-service.ts:625-646`, `src/lib/upload-service.ts:886-910`
- visibility 복귀 후 30초 stall 감지는 유지된다. 이번 단계에서 reset/cancel abort 경로는 추가됐지만, 느린 네트워크 전용 E2E 재검증은 아직 없다.
  `src/lib/upload-service.ts:667-683`, `src/app/upload/page.tsx`
- 썸네일은 업로드 완료 후 백그라운드에서 별도로 올라가므로, 느린 네트워크에서는 저장 직후 thumbnail 부재 상태가 길어질 수 있다.
  `src/lib/upload-service.ts:1028-1033`, `src/lib/upload-service.ts:1227-1264`
- 느린 네트워크 전용 Playwright 시나리오는 없다.

## 데이터 유실 가능성
- review 단계의 trim/spotlight/freeze/highlight/overlay 편집값은 새로고침, 앱 종료, 다른 라우트 이탈 시 복구되지 않는다.
- processing/review 중 reset은 이번 단계에서 실제 업로드 abort와 연결했다. 다만 해당 경로의 모바일 E2E 재검증은 아직 남아 있다.
- featured 저장 분기에서 후속 연결만 실패해도 사용자는 “전체 저장 실패”로 이해할 수 있다. 실제로는 clip 메타데이터 일부가 이미 저장됐을 가능성이 있다.

## 검증 결과
- `npm run lint`: 통과. 다만 warning 67개.
- `npm run typecheck`: 통과.
- `npm run test:run`: 통과. `12 files / 68 tests`.
- `npm run test:video`: 실패.
  `5 passed / 1 failed / 9 skipped`
  실패: `tests/e2e/video/profile-card-editor.spec.ts`의 "로그인 상태에서 프로필 자동 채움"
  스킵: `tests/e2e/video/video-upload-flow.spec.ts`는 `VIDEO_FILE` 환경변수가 없으면 전부 스킵되도록 작성돼 있다.
  스킵: `tests/e2e/video/video-player.spec.ts`는 시드된 profile clip이 없으면 전부 스킵된다.

## 현재 분류 요약

### `Blocker`
- share/reel playback contract 불일치
- upload-store 레거시 필드 과다
- upload-service / ParentQuickUpload 업로드 로직 중복

### `Important but not blocker`
- test:video 실패/skip 혼합 상태
- featured 저장의 부분 성공/부분 실패 혼합 가능성
- 로컬 preview와 원격 재생 자산 검증 분리
- review profile card preview와 실제 player-card 데이터 소스 차이
- 작은 화면 회귀 미검증

### `Nice to have`
- reel transition 저장 미지원
- lint warning 정리
