# Footory 안정화 보고서

## 문서 목적
- 이 문서는 Prompt 1~6 이후 추가된 문서와 현재 코드 상태를 기준으로, 무엇을 기준 문서로 유지하고 무엇을 합치거나 다시 써야 하는지 정리한다.
- 판단 기준은 실제 라우트, 실제 컴포넌트 연결, 실제 API 호출, 현재 워크트리 변경이다.
- 이번 단계에서는 새 기능 제안이나 코드 삭제를 하지 않고 문서 기준만 잠근다.

## 점검 범위
- `AGENTS.md`
- `docs/app-overview.md`
- `docs/repo-recovery-plan.md`
- `docs/repo-audit.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/code-review.md`
- `docs/video-highlight-reference.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/subagents.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`

## 존재 여부와 품질 점검

| 문서 | 존재 여부 | 품질 판단 | 판단 근거 |
| --- | --- | --- | --- |
| `AGENTS.md` | 있음 | 높음 | 작업 범위, 계획 문서 우선, 검증 규칙이 명확하다. 이번 안정화 단계의 상위 운영 규칙으로 그대로 쓸 수 있다. |
| `docs/app-overview.md` | 있음 | 중간 | 저장소 전반 구조 요약은 좋지만 업로드 섹션이 아직 `SelectView -> DecorateView -> DoneView` 기준이라 현재 `/upload` 구현과 어긋난다. |
| `docs/repo-recovery-plan.md` | 있음 | 높음 | 정리 순서와 삭제 보류 기준이 잘 정리되어 있다. 이번 안정화 단계도 반영됐다. |
| `docs/repo-audit.md` | 있음 | 중간 | 근거 중심 분류는 좋지만 일반 업로드 메인 경로와 E2E 상태 설명이 현재 워크트리보다 한 단계 뒤에 있다. |
| `docs/product-dna.md` | 있음 | 높음 | 제품 정체성과 금지 원칙이 선명하고 현재 코드 판단 기준으로 쓰기에 충분하다. |
| `docs/feature-scope.md` | 있음 | 높음 | 제품 범위와 비범위가 `product-dna`와 잘 맞물린다. 구현보다 상위 기준 문서로 유지 가능하다. |
| `docs/code-review.md` | 있음 | 중간 | 리뷰 체크리스트로는 유용하지만 `AGENTS.md`, `product-dna.md`, `feature-scope.md`와 내용 중복이 많다. |
| `docs/video-highlight-reference.md` | 있음 | 높음 | 참조 영상에서 무엇을 따라야 하고 무엇을 따라하지 말아야 하는지 분리가 잘 되어 있다. |
| `docs/video-upload-editing-spec.md` | 있음 | 중간 | 다음 기준 사양으로는 좋지만 현재 구현 설명 문서로 읽으면 과한 부분이 있다. 대상 사양 문서로 유지해야 한다. |
| `docs/media-pipeline.md` | 있음 | 중간 | 목표 파이프라인은 분명하지만 현재 구현에는 없는 프로젝트 저장, 렌더 결과 분리, 복구 흐름이 포함되어 있다. 현재 설명 문서가 아니라 목표 문서다. |
| `docs/subagents.md` | 있음 | 낮음 | 제품/구현 기준 문서가 아니라 에이전트 운영 메모에 가깝다. `AGENTS.md`와 중복되는 원칙이 많다. |
| `docs/testing/video-highlight-acceptance.md` | 있음 | 중간 | 다음 MVP acceptance 기준으로는 유효하지만, 문서 안의 "현재 구현에는 아직 없다" 서술 일부가 현재 워크트리와 어긋난다. |
| `docs/testing/playwright-scenarios.md` | 있음 | 중간 | 필요한 시나리오 목록은 좋지만, 현재 E2E 불일치 설명이 최신 업로드 테스트 변경을 반영하지 못했다. |

## 유지할 문서
- `AGENTS.md`
- `docs/repo-recovery-plan.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-highlight-reference.md`

## 합칠 문서
- `AGENTS.md` + `docs/code-review.md`
  현재 작업 규칙과 리뷰 체크리스트의 기준 문장이 많이 겹친다. 운영 규칙은 `AGENTS.md`에 두고, 리뷰 체크리스트는 부록 또는 하위 섹션으로 흡수하는 편이 낫다.
- `AGENTS.md` + `docs/subagents.md`
  `docs/subagents.md`는 코드/제품 기준 문서가 아니라 에이전트 운영 메모다. 별도 기준본으로 두기보다 `AGENTS.md`의 운영 보조 규칙으로 합치는 편이 맞다.

## 다시 써야 하는 문서
- `docs/app-overview.md`
  `/upload` 메인 경로를 `select -> processing -> review` 기준으로 다시 써야 한다.
- `docs/repo-audit.md`
  일반 업로드 흐름, 관련 컴포넌트, 영상 테스트 상태를 현재 워크트리 기준으로 다시 맞춰야 한다.
- `docs/testing/video-highlight-acceptance.md`
  현재 구현 대비 부족한 항목과 이미 들어온 항목을 다시 나눠 써야 한다.
- `docs/testing/playwright-scenarios.md`
  현재 `video-upload-flow.spec.ts`의 변경을 반영해 "현재 커버됨/아직 없음"을 다시 써야 한다.

## 삭제 가능한 문서
- 즉시 삭제 가능한 핵심 기준 문서는 없다.
- 다만 `docs/subagents.md`는 `AGENTS.md`로 병합한 뒤 삭제 가능하다.
- `docs/code-review.md`도 `AGENTS.md`로 병합하면 별도 파일 유지 필요성이 낮아진다.

## 지금 기준본으로 잠글 핵심 문서 7개
- `AGENTS.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/repo-audit.md`
- `docs/repo-recovery-plan.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`

## 잠금 원칙
- 제품 방향 판단은 `docs/product-dna.md`와 `docs/feature-scope.md`를 우선한다.
- 현재 코드 사실 확인은 `docs/repo-audit.md`를 우선한다.
- 정리 순서와 삭제/보류 판단은 `docs/repo-recovery-plan.md`를 우선한다.
- 영상 관련 다음 단계 목표는 `docs/video-upload-editing-spec.md`와 `docs/media-pipeline.md`를 우선한다.
- `docs/app-overview.md`, `docs/testing/video-highlight-acceptance.md`, `docs/testing/playwright-scenarios.md`는 잠금 대상이 아니라 재작성 대상이다.

## 이번 단계 결론
- 현재 기준본은 이미 충분히 많다. 더 만드는 것보다 역할이 겹치는 문서를 줄이고, 현재 설명 문서와 목표 사양 문서를 분리하는 것이 먼저다.
- 당장 잠가야 할 것은 제품 DNA, 기능 범위, 현재 코드 감사, 정리 순서, 영상 목표 사양이다.
- 먼저 다시 써야 할 것은 현재 구현 설명 문서와 테스트 기준 문서다.
