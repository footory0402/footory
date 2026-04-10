# Footory docs archive plan

> Last updated: 2026-04-10
> 목적: `docs/` 정리 작업에서 무엇을 바로 archive하고, 무엇을 먼저 merge한 뒤 archive할지 고정한다.

## 원칙
- 이번 문서는 실제 파일 이동 실행 문서가 아니라 archive 순서와 선행조건을 고정하는 문서다.
- Canonical 문서는 archive 대상에 넣지 않는다.
- Reference 문서는 즉시 archive하지 않는다.
- Merge 문서는 살아 있는 정보를 기준 문서에 흡수한 뒤 archive한다.
- 최근 작업 문서와 예전 레거시 문서를 같은 방식으로 취급하지 않는다.
- 최근 작업 문서는 현재 정리 맥락을 설명하는 보조 문서로 유지할 수 있다.
- 예전 레거시는 현재 코드와 일치하는 사실만 최소 범위로 흡수하고, 구형 흐름이나 설계 구조는 다시 기준본에 섞지 않는다.

## 현재 Canonical 세트
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/release-readiness.md`
- `docs/ship-blockers.md`
- `docs/repo-recovery-plan.md`
- `docs/docs-classification.md`
- `docs/archive-plan.md`

## 1. 이번 라운드 archive 완료

| 문서 | 이유 | 선행조건 |
| --- | --- | --- |
| `docs/archive/2026-04-10/ARCHITECTURE.md` | R2 키 체계와 스키마 메모를 기준 문서에 흡수한 뒤 archive로 이동했다. | 완료 |
| `docs/archive/2026-04-10/PROGRESS.md` | 구형 제품 범위와 완료 상태를 넓게 적어 현재 기준 문서와 충돌했다. | 완료 |
| `docs/archive/2026-04-10/UPLOAD-ARCHITECTURE.md` | presign/direct/multipart 운영 메모를 기준 문서에 흡수한 뒤 archive로 이동했다. | 완료 |
| `docs/archive/2026-04-10/code-review.md` | 리뷰 체크리스트를 `AGENTS.md` 등 상위 운영 규칙에 흡수한 뒤 archive로 이동했다. | 완료 |
| `docs/archive/2026-04-10/deletion-candidates.md` | 삭제 후보/보류 근거를 `repo-recovery-plan` 중심으로 흡수한 뒤 archive로 이동했다. | 완료 |
| `docs/archive/2026-04-10/next-remediation-plan.md` | 해결 전 blocker 설계 메모와 후속 구현 기록이 섞여 현재 기준본으로 쓰기 어려웠다. | 완료 |
| `docs/archive/2026-04-10/refactor-rules.md` | 정리 원칙을 상위 작업 지침과 recovery plan에 흡수한 뒤 archive로 이동했다. | 완료 |
| `docs/archive/2026-04-10/subagents.md` | `AGENTS.md`와 `docs/agent-company.md`가 역할 설명을 대체하고, 본문도 구형 업로드 흐름을 포함했다. | 완료 |

## 2. merge 후 archive

| 문서 | 흡수 대상 | 먼저 옮길 내용 | archive 전 확인 |
| --- | --- | --- | --- |
| `docs/testing/video-validation-report.md` | `docs/release-readiness.md`, `docs/ship-blockers.md`, `docs/testing/playwright-scenarios.md` | 살아 있는 QA 결론, 남은 회귀 공백, 최신 검증 결과만 요약 | 중복 로그와 과거 패치 기록을 분리했는지 |

## 3. Reference로 유지

| 문서 | 유지 이유 |
| --- | --- |
| `docs/DESIGN-SYSTEM.md` | 시각 언어 참고 자료로 유효하다. |
| `docs/agent-company.md` | 운영 역할 템플릿과 로컬 허브 설명이 남아 있다. |
| `docs/app-overview.md` | 저장소 전체 라우트 개요를 빠르게 훑는 참고 문서로 쓸 수 있다. |
| `docs/implementation-gap.md` | 문서와 구현 차이를 추적하는 기록으로 유효하다. |
| `docs/legacy-video-architecture-review.md` | 기존 영상 아키텍처 보존 판단 근거가 남아 있다. |
| `docs/repo-audit.md` | 실제 코드 기준 감사 기록으로 참고 가치가 있다. |
| `docs/stabilization-report.md` | 기준 문서 잠금 초기 상태를 기록한다. |
| `docs/video-highlight-reference.md` | 영상 어필 톤 참고 자료로 남길 가치가 있다. |

## 3A. 유지 판단 축
- `Recent Working Docs`
  - `repo-audit`, `stabilization-report`, `implementation-gap`, `legacy-video-architecture-review`처럼 최근 정리 판단을 보조하는 문서들이다.
- `Legacy Archive / Reference`
  - archive 아래 과거 설계/로그 문서들은 직접 기준본이 아니고, 필요할 때 사실 확인용으로만 본다.

## 4. 실행 순서
1. `docs/testing/video-validation-report.md`는 최신 QA 결론만 상위 QA 문서로 옮긴 뒤 긴 실행 로그 문서로 archive한다.

## 5. 이번 단계 결론
- 이번 라운드에서 archive 완료 문서 5개를 실제로 이동했다.
- 남은 merge 후 archive 대상은 4개다.
- 나머지는 당장 지우지 않고 reference 또는 canonical로 유지한다.

## 6. 이번 라운드 다음 처리 목표
- `docs/testing/video-validation-report.md`
  - 마지막 merge 후 archive 대상
