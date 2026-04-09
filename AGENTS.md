# Footory 작업 지침

## 목적
- 이 저장소는 유소년 축구 선수 포트폴리오 모바일 웹앱이다.
- 제품 방향을 임의로 바꾸지 않는다.
- 요청된 범위를 넘겨 scope를 확장하지 않는다.

## 기본 원칙
- 추측보다 실제 코드와 실제 라우트, 실제 호출 흐름을 우선한다.
- 설계 문서와 구현이 다르면 구현을 기준으로 판단하고, 문서 불일치는 별도로 기록한다.
- 기존 기능을 정리하거나 제거할 때는 반드시 호출 근거와 미사용 근거를 남긴다.
- 큰 작업은 바로 시작하지 말고 먼저 계획 문서를 갱신한 뒤 진행한다.

## 계획 문서 규칙
- 중간 이상 규모의 작업은 시작 전에 `docs/repo-recovery-plan.md`를 먼저 갱신한다.
- 작업 중 판단이 바뀌면 코드보다 문서 계획을 먼저 갱신한다.
- 삭제, 병합, 경로 이전 같은 구조 변경은 계획 문서에 대상과 근거를 적고 시작한다.

## 검증 규칙
- 코드 수정 후 반드시 `npm run lint`, `npm run typecheck`, `npm run test:run`을 실행한다.
- 사용자 흐름에 영향이 있는 변경은 필요한 범위의 E2E도 추가로 실행한다.
- 영상 관련 변경은 가능하면 `npm run test:video` 또는 관련 Playwright 시나리오로 확인한다.
- 검증을 생략한 경우에는 이유를 문서나 보고에 명시한다.

## Documentation routing

- 제품 방향/범위 변경 작업:
  - 먼저 읽기: docs/product-dna.md, docs/feature-scope.md

- 영상 업로드/재생/저장/편집 작업:
  - 먼저 읽기: docs/video-product-decisions.md, docs/video-upload-editing-spec.md, docs/media-pipeline.md

- UX/플로우/문구 작업:
  - 먼저 읽기: docs/video-ux-principles.md, docs/video-edit-flow.md, docs/video-copy-guidelines.md

- QA/테스트/배포 준비 작업:
  - 먼저 읽기: docs/testing/video-highlight-acceptance.md, docs/testing/playwright-scenarios.md, docs/testing/video-validation-report.md, docs/ship-blockers.md, docs/release-readiness.md

## Legacy/reference docs

- 아래 문서는 참고용이다. canonical 문서와 충돌하면 canonical 문서를 우선한다.
- docs/UPLOAD-ARCHITECTURE.md
- docs/ARCHITECTURE.md
- docs/repo-audit.md
- tests/e2e/video/*.spec.ts
- tests/e2e/upload-wizard.spec.ts

규칙:
- 작업과 무관한 docs 전체를 처음부터 전부 읽지 말 것
- 먼저 라우팅된 문서만 읽고, 필요할 때만 추가 문서를 열 것
- 문서가 충돌하면 canonical 문서를 따른다
- legacy 문서는 배경 이해용으로만 사용한다

## Work protocol

- 복잡하거나 범위가 애매한 작업은 먼저 /plan 으로 실행 계획을 세운다.
- 코드 수정 전에 관련 canonical 문서를 먼저 확인한다.
- 한 번에 한 사용자 플로우만 고친다.
- 새 기능 추가보다 기존 핵심 플로우 복구를 우선한다.
- 작업 후 관련 문서와 테스트를 함께 갱신한다.

## Definition of done

- 사용자가 실제 플로우를 수행할 수 있어야 한다.
- lint, typecheck, test 를 통과해야 한다.
- 관련 Playwright smoke 또는 E2E가 통과해야 한다.
- 사용자용 문구는 한국어 기준으로 검토되어야 한다.
- 문서와 실제 동작이 어긋나면 문서를 갱신하거나 코드를 수정한다.

## UX constraints

- 사용자용 문구에 불필요한 영어를 쓰지 말 것
- 한 화면에서 핵심 행동은 1~2개만 명확히 보일 것
- 영상 위 오버레이는 safe area 를 지킬 것
- 인스타그램/틱톡처럼 단순한 편집 UX를 우선할 것
- 전문 편집기처럼 복잡한 멀티패널 구조를 만들지 말 것

## 정리 작업 규칙
- 죽은 코드, 실험 흔적, 버려진 경로를 지울 때는 한 번에 넓게 지우지 않는다.
- 먼저 `현재 사용 중`, `실험 흔적`, `삭제 후보`, `보류`를 구분한 뒤 단계적으로 정리한다.
- 영상 업로드, 편집, 렌더링, 공개 링크 재생은 서로 연결된 흐름이므로 개별 파일만 보고 삭제하지 않는다.

## 참고 문서
- 제품/개발 설명: `README.md`, `CLAUDE.md`
- 현재 구조 진단: `docs/app-overview.md`, `docs/repo-audit.md`
- 정리 순서와 우선순위: `docs/repo-recovery-plan.md`



