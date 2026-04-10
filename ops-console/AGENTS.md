# ops-console 작업 지침

## 목적
- `ops-console`은 Footory 사용자 앱과 분리된 로컬 전용 관리자 콘솔이다.
- 이 앱은 `../` 상위 Footory 저장소를 모니터링하고, 허용된 문서와 운영 상태 파일을 로컬에서 직접 읽고 쓴다.
- 사용자용 제품 경험을 만들기 위한 앱이 아니라, 관리자 판단과 운영 정리를 위한 도구다.

## 로컬 연동 원칙
- 이 앱은 항상 로컬에서만 실행한다.
- `localhost`, `127.0.0.1`, `::1`, `0.0.0.0` 외의 접근을 허용하지 않는다.
- 운영 상태는 `ops-console/company-data/ops-state.json`에 저장한다.
- 관리 문서 편집은 상위 Footory 저장소의 실제 파일을 직접 수정한다.
- 외부 인증, 원격 배포, 멀티 유저 동기화 전제를 임의로 추가하지 않는다.

## 기본 원칙
- 관리자 입장에서 무엇을 눌러야 하는지 먼저 보이게 만든다.
- 기본 화면에는 핵심 상태와 핵심 행동만 둔다.
- 설명은 가능하면 hover/focus guide로 숨기고, 긴 설명을 기본 노출하지 않는다.
- 이 콘솔이 수정하는 대상은 `ops-console` 코드와 허용된 상위 저장소 문서뿐이다.
- 제품 방향 판단은 루트 `AGENTS.md`와 canonical docs를 따른다.

## 문서 연결 규칙
- 큰 작업 전에 루트 `docs/repo-recovery-plan.md`를 먼저 갱신한다.
- 제품 방향/범위 판단은 먼저 루트 `AGENTS.md`, `docs/product-dna.md`, `docs/feature-scope.md`를 본다.
- 영상 관련 운영 화면을 건드리면 `docs/video-product-decisions.md`, `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md`를 먼저 본다.
- UX/카피/플로우를 바꾸면 `docs/video-ux-principles.md`, `docs/video-edit-flow.md`, `docs/video-copy-guidelines.md`를 먼저 본다.
- QA/검증 패널을 바꾸면 `docs/testing/video-highlight-acceptance.md`, `docs/testing/playwright-scenarios.md`, `docs/testing/video-validation-report.md`, `docs/ship-blockers.md`, `docs/release-readiness.md`를 먼저 본다.

## UI 제약
- 모바일형 레이아웃으로 회귀하지 않는다.
- 데스크톱 관리자 콘솔로 유지한다.
- 한 섹션에 핵심 행동은 1~2개만 전면 노출한다.
- 불필요한 숫자, 내부 구현 세부사항, 긴 로그는 접거나 보조 영역으로 내린다.
- agent 사용법, 문서 목적, 필드 의미는 화면 안에서 바로 이해되게 하되 과노출하지 않는다.

## 구현 규칙
- 로컬 파일 경로, 관리 대상 문서, 허용된 검증 스크립트는 실제 코드 기준으로 유지한다.
- 새 관리 기능을 추가할 때는 "어떤 로컬 파일을 읽고 쓰는지"를 먼저 드러낸다.
- `ops-console` 자체 상태와 상위 Footory 저장소 상태를 혼동하지 않는다.
- 사용자가 바로 편집 가능한 항목과 읽기 전용 항목을 구분해서 보여준다.

## 검증 규칙
- `ops-console` 코드 수정 후 반드시 아래를 실행한다.
- `npm --prefix ops-console run lint`
- `npm --prefix ops-console run typecheck`
- `npm --prefix ops-console run build`
- 루트 저장소 코드나 문서 연동 동작에 영향이 있으면 아래도 함께 실행한다.
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- 운영 UI 흐름이 바뀌면 브라우저에서 `http://localhost:3301`을 직접 확인한다.

## 완료 기준
- 관리자가 이 콘솔이 무엇을 제어하는지 3초 안에 이해할 수 있어야 한다.
- 로컬 연동 경로와 수정 대상이 화면이나 문서로 설명 가능해야 한다.
- agent 사용, 업무 작성, 문서 수정, 검증 실행 흐름이 서로 이어져야 한다.
