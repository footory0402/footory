# Footory docs 분류 기준

> Last updated: 2026-04-10
> 목적: `docs/` 아래 문서를 현재 기준본과 레거시 문서로 다시 나누고, merge/archive 순서를 고정한다.

## 분류 기준
- `Canonical`: 지금도 기준 문서로 직접 읽어야 하는 문서
- `Merge`: 살아 있는 정보는 기준 문서로 흡수하고, 원문은 merge 후 archive할 문서
- `Reference`: 기준본은 아니지만 배경/근거/이력 확인용으로 남길 문서
- `Archive`: 더 이상 기준으로 쓰지 않고 역사 기록으로만 보관할 문서

## 문서 계층

### 1. Current Canonical
- 최근에 잠근 현재 기준 문서 세트다.
- 제품 방향, 영상 UX, 저장 계약, QA 판정은 이 문서들만 기준으로 본다.
- 예전 레거시 문서가 이 문서들과 충돌하면 무조건 canonical을 우선한다.

### 2. Recent Working Docs
- 최근 작업 과정에서 생긴 보고서, 감사 문서, 판단 근거 문서다.
- 현재 코드와 최근 정리 맥락을 이해하는 데는 유용하지만, 직접 source of truth로 쓰지는 않는다.
- canonical을 보조하는 역할만 한다.

### 3. Legacy Archive / Reference
- 과거 설계, 구형 플로우, 예전 작업 로그 문서다.
- 현재 코드와 맞는 사실만 최소 범위로 흡수하고, 문서 구조나 제품 흐름 자체는 다시 가져오지 않는다.
- 즉 “전부 흡수”하지 않고 “현재 코드와 맞는 사실만 추출”하는 용도로만 쓴다.

## 지금 잠그는 Canonical 세트

### 제품/범위
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-product-decisions.md`

### 영상 사양/UX
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`

### QA/출시 판단
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/release-readiness.md`
- `docs/ship-blockers.md`

### 문서 운영
- `docs/repo-recovery-plan.md`
- `docs/docs-classification.md`
- `docs/archive-plan.md`

## Recent Working Docs
- `docs/repo-audit.md`
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`
- `docs/legacy-video-architecture-review.md`
- `docs/app-overview.md`
- `docs/agent-company.md`

## Legacy Archive / Reference
- `docs/archive/2026-04-10/ARCHITECTURE.md`
- `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`
- `docs/archive/2026-04-10/PROGRESS.md`
- `docs/archive/2026-04-10/next-remediation-plan.md`
- `docs/archive/2026-04-10/subagents.md`
- `docs/archive/2026-04-10/code-review.md`
- `docs/archive/2026-04-10/deletion-candidates.md`
- `docs/archive/2026-04-10/refactor-rules.md`

## 전체 문서 분류표

| 문서 | 분류 | 연결 기준 문서 또는 흡수 대상 | 판단 이유 | archive 처리 |
| --- | --- | --- | --- | --- |
| `docs/archive/2026-04-10/ARCHITECTURE.md` | Archive | `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md` | R2 구조, 스키마, API 도메인 설명 일부를 기준 문서에 흡수한 뒤 archive로 이동했다. | archive 완료 |
| `docs/DESIGN-SYSTEM.md` | Reference | `docs/product-dna.md` | 시각 언어 참고 자료로는 쓸 수 있지만 현재 영상/문서 기준본은 아니다. | 유지 |
| `docs/archive/2026-04-10/PROGRESS.md` | Archive | - | 소셜, 피드, 구형 위저드 기준 진행 기록이 현재 기준 문서와 충돌해 archive로 이동했다. | archive 완료 |
| `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md` | Archive | `docs/media-pipeline.md`, `docs/legacy-video-architecture-review.md` | presign/direct/multipart 제약과 운영 메모를 기준 문서에 흡수한 뒤 archive로 이동했다. | archive 완료 |
| `docs/agent-company.md` | Reference | `AGENTS.md` | 운영 역할 템플릿과 로컬 허브 메모는 남길 가치가 있지만 제품/영상 기준본은 아니다. | 유지 |
| `docs/app-overview.md` | Reference | `docs/repo-audit.md` | 라우트 개요 문서로 참고 가치는 있으나 업로드 메인 흐름 설명이 현재 기준과 어긋난다. | 유지 |
| `docs/archive-plan.md` | Canonical | `docs/archive-plan.md` | 문서 archive 대상과 실행 순서를 관리하는 현재 기준 문서다. | 유지 |
| `docs/archive/2026-04-10/code-review.md` | Archive | `AGENTS.md`, `docs/product-dna.md`, `docs/feature-scope.md` | 리뷰 체크리스트를 상위 운영 규칙에 흡수한 뒤 archive로 이동했다. | archive 완료 |
| `docs/archive/2026-04-10/deletion-candidates.md` | Archive | `docs/repo-recovery-plan.md`, `docs/archive-plan.md` | 삭제 후보/보류 근거를 계획 문서에 흡수한 뒤 archive로 이동했다. | archive 완료 |
| `docs/docs-classification.md` | Canonical | `docs/docs-classification.md` | 어떤 문서를 기준으로 읽어야 하는지 고정하는 현재 문서 운영 기준이다. | 유지 |
| `docs/feature-scope.md` | Canonical | `docs/feature-scope.md` | MVP 범위, optional editing, phase 2 경계를 고정한다. | 유지 |
| `docs/implementation-gap.md` | Reference | `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md` | 구현과 문서 차이를 추적하는 시점성 보고서다. | 유지 |
| `docs/legacy-video-architecture-review.md` | Reference | `docs/video-product-decisions.md`, `docs/media-pipeline.md` | 기존 영상 구조에서 무엇을 보존했는지 판단 근거를 남기는 문서다. | 유지 |
| `docs/media-pipeline.md` | Canonical | `docs/media-pipeline.md` | clip metadata 기반 재생과 저장 계약을 고정하는 핵심 기준이다. | 유지 |
| `docs/archive/2026-04-10/next-remediation-plan.md` | Archive | - | blocker 3~5 계획 문서인데 이후 해결 상태와 섞여 현재 기준 문서로 읽기 어려워 archive로 이동했다. | archive 완료 |
| `docs/product-dna.md` | Canonical | `docs/product-dna.md` | 제품 목적과 금지선을 잠그는 최상위 기준이다. | 유지 |
| `docs/archive/2026-04-10/refactor-rules.md` | Archive | `AGENTS.md`, `docs/repo-recovery-plan.md` | 정리 원칙을 상위 문서에 흡수한 뒤 archive로 이동했다. | archive 완료 |
| `docs/release-readiness.md` | Canonical | `docs/release-readiness.md` | 지금 출시에 가능한지 판단하는 현재 QA 기준 문서다. | 유지 |
| `docs/repo-audit.md` | Reference | `docs/repo-recovery-plan.md` | 실제 코드 기준 감사 기록으로는 유효하지만 현재 업로드 흐름 설명이 일부 낡았다. | 유지 |
| `docs/repo-recovery-plan.md` | Canonical | `docs/repo-recovery-plan.md` | 정리 순서와 문서/구조 변경 선행 조건을 고정하는 작업 기준이다. | 유지 |
| `docs/ship-blockers.md` | Canonical | `docs/ship-blockers.md` | 사용자 영향 기준 blocker와 중요 이슈를 잠그는 현재 기준 문서다. | 유지 |
| `docs/stabilization-report.md` | Reference | `docs/docs-classification.md` | 문서 잠금 초기 판단을 남긴 시점성 보고서다. | 유지 |
| `docs/archive/2026-04-10/subagents.md` | Archive | - | `AGENTS.md`, `docs/agent-company.md`와 중복되고 `/upload` 구형 흐름 설명도 남아 있어 archive로 이동했다. | archive 완료 |
| `docs/testing/playwright-scenarios.md` | Canonical | `docs/testing/playwright-scenarios.md` | 모바일 우선 회귀 시나리오 기준을 정의한다. | 유지 |
| `docs/testing/video-highlight-acceptance.md` | Canonical | `docs/testing/video-highlight-acceptance.md` | clip-first core flow 완료 판정 기준이다. | 유지 |
| `docs/testing/video-validation-report.md` | Merge | `docs/release-readiness.md`, `docs/ship-blockers.md`, `docs/testing/playwright-scenarios.md` | 실행 로그와 패치 기록이 과도하게 누적돼 기준 문서보다 변경 이력 로그에 가깝다. | 정리 후 archive |
| `docs/video-copy-guidelines.md` | Canonical | `docs/video-copy-guidelines.md` | 한국어 행동 문구 기준을 고정한다. | 유지 |
| `docs/video-edit-flow.md` | Canonical | `docs/video-edit-flow.md` | 단일 clip 편집 단계와 CTA 구조를 고정한다. | 유지 |
| `docs/video-highlight-reference.md` | Reference | `docs/video-ux-principles.md`, `docs/video-copy-guidelines.md` | 어필 톤 참고 자료로는 유효하지만 현재 기준 문서 세트의 직접 source of truth는 아니다. | 유지 |
| `docs/video-product-decisions.md` | Canonical | `docs/video-product-decisions.md` | clip-first, optional editing, phase 2 경계를 잠근다. | 유지 |
| `docs/video-upload-editing-spec.md` | Canonical | `docs/video-upload-editing-spec.md` | 업로드/편집의 제품 사양 기준 문서다. | 유지 |
| `docs/video-ux-principles.md` | Canonical | `docs/video-ux-principles.md` | 모바일 영상 UX 원칙을 고정한다. | 유지 |

## 즉시 archive 가능 문서
- 없음

## archive 완료 문서
- `docs/archive/2026-04-10/ARCHITECTURE.md`
- `docs/archive/2026-04-10/PROGRESS.md`
- `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md`
- `docs/archive/2026-04-10/code-review.md`
- `docs/archive/2026-04-10/deletion-candidates.md`
- `docs/archive/2026-04-10/next-remediation-plan.md`
- `docs/archive/2026-04-10/refactor-rules.md`
- `docs/archive/2026-04-10/subagents.md`

## merge 후 archive 대상
- `docs/testing/video-validation-report.md`

## 유지하는 Reference 문서
- `docs/DESIGN-SYSTEM.md`
- `docs/agent-company.md`
- `docs/app-overview.md`
- `docs/implementation-gap.md`
- `docs/legacy-video-architecture-review.md`
- `docs/repo-audit.md`
- `docs/stabilization-report.md`
- `docs/video-highlight-reference.md`

## 해석 원칙
- 제품 판단은 `product-dna -> feature-scope -> video-product-decisions` 순서로 본다.
- 영상 구현/UX 판단은 `video-upload-editing-spec -> media-pipeline -> video-ux-principles -> video-edit-flow -> video-copy-guidelines` 순서로 본다.
- QA와 출시 판단은 `video-highlight-acceptance -> playwright-scenarios -> release-readiness -> ship-blockers` 순서로 본다.
- recent working docs는 현재 정리 맥락을 설명하는 보조 문서로만 사용한다.
- legacy 문서에서 살아 있는 내용은 “현재 코드와 일치하는 사실”만 최소 범위로 흡수하고, 원문 구조나 구형 제품 흐름은 다시 기준본에 섞지 않는다.
- legacy 원문은 중복 기준본으로 유지하지 않는다.
