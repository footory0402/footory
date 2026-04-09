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

## 영상 관련 작업 규칙
- 영상 관련 변경은 먼저 reference spec과 acceptance 문서를 확인한다.
- 현재 저장소에는 전용 `specs/` 문서가 비어 있으므로, 작업 전 최소 다음 자료를 먼저 확인한다.
- `docs/UPLOAD-ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/repo-audit.md`
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`
- 전용 reference spec이나 acceptance 문서가 추가되면 위 목록보다 그 문서를 우선한다.

## 정리 작업 규칙
- 죽은 코드, 실험 흔적, 버려진 경로를 지울 때는 한 번에 넓게 지우지 않는다.
- 먼저 `현재 사용 중`, `실험 흔적`, `삭제 후보`, `보류`를 구분한 뒤 단계적으로 정리한다.
- 영상 업로드, 편집, 렌더링, 공개 링크 재생은 서로 연결된 흐름이므로 개별 파일만 보고 삭제하지 않는다.

## 참고 문서
- 제품/개발 설명: `README.md`, `CLAUDE.md`
- 현재 구조 진단: `docs/app-overview.md`, `docs/repo-audit.md`
- 정리 순서와 우선순위: `docs/repo-recovery-plan.md`
