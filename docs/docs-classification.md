# 기존 docs 분류

## 문서 목적
- `docs/` 아래 기존 문서를 실제 코드 기준으로 분류한다.
- 이번 분류는 삭제 지시가 아니라 기준 문서 우선순위를 고정하기 위한 문서다.
- 분류 기준은 다음 네 가지다.
  - `Canonical`
  - `Merge into Canonical`
  - `Reference Only`
  - `Archive`

## 분류표

| 문서 | 분류 | 연결 기준 문서 | 판단 이유 |
| --- | --- | --- | --- |
| `docs/product-dna.md` | Canonical | `docs/product-dna.md` | 제품 방향을 고정하는 최상위 기준이다. 영상 판단도 이 문서를 먼저 따라야 한다. |
| `docs/feature-scope.md` | Canonical | `docs/product-dna.md`, `docs/feature-scope.md` | MVP 범위와 비범위를 고정한다. Prompt C 범위 판단의 직접 기준이다. |
| `docs/video-upload-editing-spec.md` | Canonical | `docs/feature-scope.md`, `docs/video-upload-editing-spec.md` | 다음 영상 UX와 저장 흐름의 제품 기준 문서다. 현재 구현 설명이 아니라 목표 사양 기준으로 유지한다. |
| `docs/media-pipeline.md` | Canonical | `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md` | 미디어 저장과 상태 모델의 기준 문서다. 실제 구현과 차이는 남겨도 기준본으로 유지해야 한다. |
| `docs/video-highlight-reference.md` | Canonical | `docs/product-dna.md`, `docs/video-upload-editing-spec.md` | 선수 어필형 하이라이트의 인상과 금지선을 정하는 참조 기준이다. |
| `docs/testing/video-highlight-acceptance.md` | Canonical | `docs/video-upload-editing-spec.md`, `docs/testing/video-highlight-acceptance.md` | 구현 완료 판정 기준으로 유지해야 한다. 현재 코드와 차이는 별도 기록하면 된다. |
| `docs/testing/playwright-scenarios.md` | Canonical | `docs/testing/video-highlight-acceptance.md`, `docs/testing/playwright-scenarios.md` | 영상 회귀 테스트 기준 문서다. 테스트 코드보다 먼저 참고하는 문서로 유지한다. |
| `docs/repo-recovery-plan.md` | Canonical | `docs/repo-recovery-plan.md` | 정리 순서, 보류 기준, 계획 우선 원칙을 고정하는 작업 기준 문서다. |
| `docs/repo-audit.md` | Canonical | `docs/repo-audit.md`, `docs/repo-recovery-plan.md` | 현재 구조 진단과 정리 근거 문서다. 실제 코드 기준 판단의 핵심 레퍼런스다. |
| `docs/ARCHITECTURE.md` | Merge into Canonical | `docs/media-pipeline.md`, `docs/repo-audit.md`, `docs/legacy-video-architecture-review.md` | 스키마와 R2 구조 설명은 유용하지만 현재 구현과 어긋나는 설계 서술이 섞여 있다. 살아 있는 부분만 기준 문서로 흡수해야 한다. |
| `docs/UPLOAD-ARCHITECTURE.md` | Merge into Canonical | `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md` | presign, direct upload, multipart 제약 설명은 유효하다. 다만 일반 업로드 플로우 설명과 상수 값이 낡았다. |
| `docs/app-overview.md` | Merge into Canonical | `docs/repo-audit.md`, `docs/legacy-video-architecture-review.md` | 현재 상태 요약 문서 역할은 필요하지만 업로드 섹션이 실제 코드보다 뒤처져 있다. 현재 설명은 repo-audit 계열로 흡수하는 편이 낫다. |
| `docs/code-review.md` | Merge into Canonical | `AGENTS.md`, `docs/product-dna.md`, `docs/feature-scope.md` | 리뷰 체크리스트로는 유효하지만 상위 원칙과 중복이 많다. 별도 기준본보다 운영 규칙에 흡수하는 편이 맞다. |
| `docs/refactor-rules.md` | Merge into Canonical | `AGENTS.md`, `docs/repo-recovery-plan.md` | 정리 원칙은 유효하지만 별도 문서보다 recovery plan과 작업 지침에 흡수하는 편이 명확하다. |
| `docs/deletion-candidates.md` | Merge into Canonical | `docs/repo-recovery-plan.md`, `docs/repo-audit.md` | 후보 목록 자체는 유효하지만 독립 기준 문서가 아니라 recovery plan의 작업 메모에 가깝다. |
| `docs/stabilization-report.md` | Reference Only | `docs/repo-recovery-plan.md`, `docs/docs-classification.md` | 특정 시점의 문서 상태 보고서다. 유지 가치가 있지만 상시 기준본은 아니다. |
| `docs/implementation-gap.md` | Reference Only | `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md` | 문서와 구현의 차이를 빠르게 파악하는 데 유용하다. 다만 gap 기록 문서라 canonical로 두지는 않는다. |
| `docs/DESIGN-SYSTEM.md` | Reference Only | `docs/product-dna.md`, `docs/DESIGN-SYSTEM.md` | 시각 언어 참고 문서로는 유효하다. 이번 영상 아키텍처 정리의 중심 기준 문서는 아니다. |
| `docs/subagents.md` | Reference Only | `AGENTS.md`, `docs/product-dna.md` | 에이전트 운영 메모 성격이 강하다. 저장소 기능 기준 문서라기보다 협업 보조 문서다. |
| `docs/PROGRESS.md` | Archive | `docs/repo-audit.md`, `docs/app-overview.md` | 스프린트 기록과 완료 항목이 현재 구현과 불일치하는 부분이 많다. 역사 기록으로만 남기고 현재 기준 문서로 쓰지 않는 편이 맞다. |

## 연결 해석

- 제품 방향은 `docs/product-dna.md`와 `docs/feature-scope.md`를 먼저 본다.
- 영상 제품/QA 기준은 `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md`, `docs/testing/video-highlight-acceptance.md`, `docs/testing/playwright-scenarios.md`를 먼저 본다.
- 저장소 현재 상태와 정리 순서는 `docs/repo-audit.md`, `docs/repo-recovery-plan.md`를 먼저 본다.
- 기존 기술 문서에서 살아 있는 설명은 `docs/ARCHITECTURE.md`, `docs/UPLOAD-ARCHITECTURE.md`, `docs/app-overview.md`에서 가져오되, 흡수 후에는 중복 기준본으로 두지 않는다.

## 이번 작업 산출물 메모

- `docs/legacy-video-architecture-review.md`는 기존 영상 체계 보존 판정 문서다.
- `docs/docs-classification.md`는 docs 기준본 우선순위 고정 문서다.
- 두 문서는 기존 문서 분류 결과를 통합한 새 보조 기준이며, "기존 문서" 분류표에는 포함하지 않았다.
