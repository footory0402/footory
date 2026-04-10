# Footory 저장소 복구 계획

## 목적
- 이 문서는 지금 당장 코드를 지우기 위한 문서가 아니다.
- 현재 구현을 기준으로 어떤 순서로 정리해야 위험을 줄일 수 있는지 정리한다.
- 기준 문서는 `docs/repo-audit.md`와 실제 코드다.

## 원칙
- 제품 방향을 바꾸지 않는다.
- 영상 기능은 단일 주 경로를 먼저 정한 뒤 주변 흔적을 정리한다.
- 삭제 전에 반드시 호출 근거와 비호출 근거를 다시 확인한다.
- 큰 정리 작업은 이 문서를 먼저 갱신하고 시작한다.

## 0단계: Prompt 1~6 결과 안정화

### 목표
- 새 기능 개발을 멈추고 현재 문서와 워크트리 변경을 실제 코드 기준으로 정리한다.
- 무엇을 기준 문서로 유지할지, 무엇을 합치거나 다시 써야 할지, 무엇을 잠글지 먼저 결정한다.
- Prompt 5, 6에서 확장된 업로드/하이라이트 코드가 현재 기준 문서와 어디서 어긋나는지 기록한다.

### 이번 단계 산출물
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`

### 이번 단계에서 확인할 문서
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

### 해야 할 일
- 각 문서의 존재 여부와 실제 코드 기준 유효성을 점검한다.
- 문서를 `유지`, `병합`, `재작성`, `삭제 가능`, `핵심 기준본 잠금`으로 분류한다.
- 현재 워크트리의 업로드/하이라이트 변경 파일을 읽고 문서와의 구현 차이를 정리한다.
- 이번 단계에서는 코드 삭제나 대규모 수정 없이 분석과 문서 잠금만 수행한다.

### 완료 기준
- 팀원이 어떤 문서를 기준본으로 봐야 하는지 즉시 판단할 수 있어야 한다.
- 다음 리팩터링 단계에서 어디부터 손대야 하는지 우선순위가 문서로 고정되어 있어야 한다.

## 0.5단계: 기존 영상 아키텍처 및 문서 보존 판정

### 목표
- Prompt C에 들어가기 전에 기존 Footory 저장소에 이미 있던 영상 아키텍처와 관련 문서를 먼저 보존 관점에서 판정한다.
- 원본 저장 구조, 편집 데이터 저장 구조, 클라이언트 재생 구조, 서버 렌더 흔적, 주인공 타겟팅 흔적을 실제 코드 기준으로 연결한다.
- 이번 단계에서는 큰 코드 수정 없이 분석과 문서 갱신만 수행한다.

### 이번 단계 산출물
- `docs/legacy-video-architecture-review.md`
- `docs/docs-classification.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`
- `docs/ARCHITECTURE.md`
- `docs/UPLOAD-ARCHITECTURE.md`
- `docs/repo-audit.md`
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`
- 업로드, 재생, 편집, 저장, R2, render worker, spotlight 관련 실제 코드

### 해야 할 일
- `docs/` 아래 기존 문서를 하나씩 읽고 `Canonical`, `Merge into Canonical`, `Reference Only`, `Archive`로 분류한다.
- Cloudflare R2 원본 저장 구조가 현재도 메인 경로인지 실제 API와 업로드 서비스 기준으로 확인한다.
- 원본 저장 후 `clips` 메타데이터를 직접 수정하는 현재 저장 방식과 문서상 목표 파이프라인의 차이를 분리해 기록한다.
- 런타임 재생 오버레이, trim, freeze, spotlight, tracking 관련 필드가 실제 재생 경로에서 쓰이는지 확인한다.
- 주인공 타겟팅 관련 UI, 데이터 모델, 재생 소비 경로를 확인하고 유지 우선순위를 판정한다.
- 충돌하는 기존 문서는 즉시 삭제하지 않고 유지 이유, 흡수 대상, 아카이브 이유를 남긴다.

### 완료 기준
- 팀원이 Prompt C 전에 "무엇을 반드시 유지해야 하고 무엇을 새 기준 문서에 흡수해야 하는지"를 즉시 판단할 수 있어야 한다.
- 기존 영상 아키텍처 중 현재도 제품 핵심인 요소와 실험 흔적을 구분한 문서 근거가 있어야 한다.

## 0.6단계: 영상 제품 결정사항 기준 잠금

### 목표
- Prompt C를 바로 진행하지 않고, Footory 영상 제품의 기준을 clip-first 구조로 먼저 다시 잠근다.
- 현재 살아 있는 아키텍처를 버리지 않으면서 core flow, optional editing, phase 2의 경계를 문서로 먼저 고정한다.
- 하이라이트를 core에서 optional editing으로 내리고, spotlight와 zoom playback을 core 필수 기능으로 승격한다.

### 이번 단계 산출물
- `docs/video-product-decisions.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/testing/video-highlight-acceptance.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`
- `docs/legacy-video-architecture-review.md`
- `docs/docs-classification.md`
- `docs/UPLOAD-ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/repo-audit.md`
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`

### 문서로 먼저 잠글 결정
- 기본 영상 단위는 하이라이트가 아니라 clip이다.
- 기본 업로드 플로우는 짧은 영상 빠른 업로드와 업로드 직후 재생 가능이다.
- 하이라이트는 필요할 때만 쓰는 선택형 편집 기능이다.
- spotlight는 필수 기능이며 zoom playback도 필수 기능이다.
- profile card와 lower third는 유지해야 하는 선수 어필 장치다.
- 런타임 재생의 기준은 `clips` 메타데이터 기반 클라이언트 재생이다.
- `render-worker/`, `/api/render/*`는 즉시 core로 복귀시키지 않고 phase 2 또는 선택형 기능으로 분리한다.

### 유지 원칙
- Cloudflare R2 원본/썸네일 저장 구조와 presign/direct-upload fallback은 유지한다.
- `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `duration_sec` 중심 저장 계약은 유지한다.
- `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.trackingMode`, `effects.trackingPoints` 소비 경로는 유지한다.
- 현재 살아 있는 클라이언트 재생 계약을 버리는 식으로 문서를 다시 쓰지 않는다.

### 완료 기준
- 팀원이 새 기준 문서만 읽고 core flow, optional editing flow, phase 2를 바로 구분할 수 있어야 한다.
- 하이라이트가 기본값이 아니라 optional editing이라는 점이 모든 기준 문서에 일관되게 반영되어 있어야 한다.
- 살아 있는 저장 계약과 재생 계약이 새 문서 기준에 명시적으로 보존되어 있어야 한다.

## 0.7단계: shipping readiness 점검 고정

### 목표
- 새 기능 추가 없이 현재 Footory 영상 기능이 실제 사용자에게 배포 가능한 상태인지 점검한다.
- clip-first core flow 기준으로 shipping blocker, 중요 이슈, 보조 개선 항목을 실제 코드 기준으로만 분류한다.
- 구현과 문서가 다르면 구현을 기준으로 기록하고 문서 불일치는 별도로 남긴다.

### 이번 단계 산출물
- `docs/release-readiness.md`
- `docs/ship-blockers.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`
- 업로드, 재생, spotlight, freeze, overlay, 저장, 프로필 반영, reel draft 생성 관련 실제 라우트와 컴포넌트
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`

### 해야 할 일
- 짧은 clip 업로드, 업로드 직후 재생, spotlight freeze, zoom playback, profile card/lower third, 저장, 프로필 반영, reel highlight draft 생성 흐름을 실제 코드 기준으로 추적한다.
- 각 플로우에 대해 `Blocker`, `Important but not blocker`, `Nice to have`를 나눈다.
- blocker는 1~5 우선순위로 정리하고, 왜 blocker인지, 사용자 영향, 해결 범위, 선행 순서를 함께 적는다.
- 모바일 사용성, 느린 네트워크/긴 업로드, 데이터 유실 가능성을 별도 항목으로 정리한다.
- 새 기능 제안이나 범위 확장은 하지 않는다.

### 완료 기준
- 팀원이 두 문서만 읽고 현재 영상 기능이 "지금 출시에 가능한지", "무엇이 막고 있는지", "무엇부터 고쳐야 하는지"를 즉시 판단할 수 있어야 한다.
- blocker와 비-blocker가 실제 코드와 테스트 근거로 연결되어 있어야 한다.

## 0.8단계: 영상 acceptance / Playwright validation 초안

### 목표
- 새 기능 추가나 코드 수정 없이 현재 구현 기준으로 영상 acceptance criteria와 Playwright 시나리오의 유효성을 점검한다.
- 문서 기대값과 실제 업로드/재생/저장 흐름이 어디서 어긋나는지 먼저 기록한다.
- 실패 항목과 재현 경로를 우선 정리해 다음 수정 단계의 입력으로 고정한다.

### 이번 단계 산출물
- `docs/testing/video-validation-report.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- 현재 `/upload`, clip 저장, profile featured 반영, clip playback 관련 실제 코드
- 현재 실행 가능한 `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`

### 해야 할 일
- acceptance criteria를 `통과`, `부분 통과`, `실패`로 분류한다.
- Playwright 시나리오 중 현재 구현과 테스트 자산 기준으로 실행 가능한 항목만 구분한다.
- spotlight, zoom, lower third, draft 저장, publish 관련 실패 지점을 따로 정리한다.
- 자동화 가능한 시나리오와 아직 수동 검증이 필요한 시나리오를 분리한다.
- 이번 단계에서는 코드 수정 없이 문서 보고만 수행한다.

### 완료 기준
- 팀원이 현재 acceptance 문서가 어디까지 실제 구현과 맞는지 한눈에 볼 수 있어야 한다.
- 실패 항목마다 재현 경로와 근거 파일이 연결되어 있어야 한다.
- 다음 수정 단계가 어떤 blocker부터 다뤄야 하는지 문서만 보고 판단할 수 있어야 한다.

## 0.9단계: 영상 QA / validation 실행

### 목표
- 새 기능 추가 없이 현재 Footory 영상 기능을 실제 사용 기준으로 재검증한다.
- 모바일 우선, 느린 네트워크 우선, 업로드/복구/재생/저장 우선으로 acceptance를 다시 판정한다.
- shipping blocker를 현재 테스트 실행 결과 기준으로 재평가한다.

### 이번 단계 산출물
- `docs/testing/video-validation-report.md` 갱신
- 필요한 경우 `docs/testing/playwright-scenarios.md` 보정
- `docs/ship-blockers.md`, `docs/release-readiness.md` 재평가 입력

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/release-readiness.md`
- `docs/ship-blockers.md`
- `docs/video-product-decisions.md`
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`

### 해야 할 일
- acceptance criteria를 `통과`, `부분 통과`, `실패`로 분류한다.
- Playwright 자동화 가능한 시나리오를 실제로 실행하거나, 실행 불가한 경우 시나리오 문서를 현실 기준으로 갱신한다.
- spotlight, zoom, lower third, publish, reel draft 관련 실패 지점을 별도 표로 정리한다.
- 모바일 화면 이슈, 느린 네트워크 이슈, 데이터 유실 이슈를 구분해 기록한다.
- 지금 배포를 막는 마지막 blocker 1개를 지정한다.

### 완료 기준
- `docs/testing/video-validation-report.md`만 읽어도 통과/실패 항목과 원인, 즉시 수정 우선순위를 판단할 수 있어야 한다.
- 이번 검증 결과가 ship blocker 재평가와 직접 연결되어 있어야 한다.

## 0.9A단계: blocker 3~5 Remediation 설계 고정 (코드 수정 금지)

### 목표
- 남은 blocker 3~5를 실제 코드 기준으로 다시 좁히고, 다음 구현 단계의 안전한 최소 작업 단위를 먼저 고정한다.
- 이번 단계에서는 구현 변경 없이 영향 범위/위험도/난이도/선행조건/작업 순서만 문서화한다.

### 이번 단계 산출물
- `docs/next-remediation-plan.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/ship-blockers.md`
- `docs/testing/video-validation-report.md`
- `docs/release-readiness.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/implementation-gap.md`
- `src/components/player/ClipPlayerSheet.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`

## 0.9B단계: 영상 핵심 플로우 E2E 상시 실행 복구

### 목표
- `VIDEO_FILE` 환경변수가 없어도 영상 핵심 Playwright 시나리오가 항상 실행되게 만든다.
- 업로드 이후 편집 진입, draft 저장/복구, 저장 후 프로필 반영 3개 핵심 흐름을 fixture + API 모킹 기준으로 상시 회귀 가능하게 고정한다.
- 이번 단계는 제품 기능 확장 없이 테스트 자산, 테스트 헬퍼, 검증 문서만 최소 범위로 정리한다.

### 이번 단계 산출물
- `tests/fixtures/videos/*` 사용 규칙 정리
- `tests/e2e/video/video-upload-flow.spec.ts` 개편
- 필요 시 `tests/e2e/video/*` 공통 헬퍼 추가
- `docs/testing/video-validation-report.md` 갱신

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/testing/video-validation-report.md`
- 현재 `/upload`, `/edit/[clipId]`, `/profile` 실제 구현
- 현재 `tests/e2e/video/*.spec.ts`
- `tests/fixtures/videos/*.mp4`

### 해야 할 일
- 저장소에 포함된 작은 mp4 fixture를 기본 업로드 입력으로 고정하고, 환경변수는 override 용도로만 남긴다.
- `VIDEO_FILE` 의존으로 skip되는 테스트를 fixture fallback 기반으로 전환한다.
- presign/upload/clips/video-projects/featured/profile 관련 API를 테스트 안에서 모킹해 업로드 이후 핵심 사용자 플로우를 외부 상태 없이 재현한다.
- 최소 3개 핵심 시나리오를 실제로 실행한다:
- 업로드 -> 편집 진입
- 업로드 -> 편집 -> 값 변경 -> 저장 -> 재진입 복구
- 업로드 -> 편집 -> 저장 -> publish/profile 반영
- 실행 결과와 남은 skip/제약을 `docs/testing/video-validation-report.md`에 기록한다.

### 하지 않을 일
- 제품 기능 확장
- playback contract 대수술
- cleanup 대수술

### 완료 기준
- 기본 Playwright 실행에서 `VIDEO_FILE` 부재로 skip되는 핵심 video E2E가 없어야 한다.
- 최소 3개 핵심 시나리오가 fixture 기반으로 실제 통과해야 한다.
- fixture 위치, 사용 방식, 실행 결과, 남은 skip 목록이 문서에 반영되어 있어야 한다.
- `src/stores/upload-store.ts`
- `src/lib/upload-service.ts`
- `src/components/parent/ParentQuickUpload.tsx`

### 해야 할 일
- blocker 3~5 각각에 대해 `실제 영향 범위`, `위험도`, `수정 난이도`, `선행 조건`, `안전한 최소 작업 단위`를 표준 형식으로 정리한다.
- `ship-blockers.md`의 기존 번호 체계와 현재 remediaton 대상 번호 체계가 다르면 문서 내에 매핑/주의를 남긴다.
- blocker 간 의존성을 정리해 동시 수정 금지 조합과 순차 처리 권장 순서를 명시한다.
- 이번 단계에서는 코드 수정, 테스트 재작성, 구조 변경을 수행하지 않는다.

### 완료 기준
- 팀원이 `docs/next-remediation-plan.md`만 읽고 blocker 3~5의 다음 실행 순서를 즉시 결정할 수 있어야 한다.
- 각 blocker의 최소 작업 단위가 독립 실행 가능한 크기로 정의되어 있어야 한다.

## 0.9B단계: 영상 편집 UX 기준 문서 잠금 (코드 수정 금지)

### 목표
- 기능 추가보다 먼저 Footory 영상 편집 UX와 화면 흐름의 기준을 단순하게 다시 고정한다.
- 업로드 직후 편집 진입, clip-first 편집, 선택형 highlight, 상위 기능 reel highlight 원칙을 문서로 먼저 잠근다.
- 사용자 문구를 쉬운 한국어 중심으로 통일하고 선수 정보 overlay 안전 영역 원칙을 함께 정리한다.

### 이번 단계 산출물
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/repo-audit.md`
- `docs/UPLOAD-ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `tests/e2e/video/video-upload-flow.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`
- 현재 `/upload`와 편집 진입 관련 실제 라우트 및 문구

### 문서로 먼저 잠글 결정
- 기본 영상 단위는 `clip`이다.
- 사용자는 업로드 후 바로 편집에 들어갈 수 있어야 한다.
- 편집 화면의 핵심 기능은 구간 자르기, 주인공 강조, 확대 재생, 선수 정보 넣기다.
- `highlight`는 선택형이며 기본 흐름을 막지 않는다.
- `reel highlight`는 단일 clip 편집보다 위에 있는 상위 기능이다.
- 한 화면에서 사용자가 해야 할 행동은 1개 또는 2개만 분명해야 한다.
- 사용자 노출 문구는 쉬운 한국어를 우선하고 영어, 기술 용어, 긴 설명을 피한다.
- 선수 정보 overlay는 safe area 원칙으로 영상 시야를 우선 보호한다.

### 완료 기준
- 팀원이 세 문서만 읽고 업로드 후 편집 흐름, 화면별 CTA, 문구 톤, overlay 배치 원칙을 바로 이해할 수 있어야 한다.
- 현재 구형 테스트와 문구 중 무엇이 새 기준과 충돌하는지 문서만 보고 판단할 수 있어야 한다.

## 0.9C단계: 영상 편집 UX 기준 반영 구현 (선택형 편집 원칙 우선)

### 목표
- 문서에 잠근 clip-first 편집 원칙을 실제 `/upload`, `/edit/[clipId]` 화면에 반영한다.
- 구간 자르기, 주인공 강조, 확대 재생, 선수 정보 넣기, 하이라이트를 모두 선택형 편집으로 보여준다.
- 업로드 후 편집 진입, 화면별 CTA, 쉬운 한국어 문구, overlay safe area 안내를 실제 UI 기준으로 맞춘다.

### 이번 단계 산출물
- `/upload` 처리 화면 문구와 진입 흐름 정리
- `/edit/[clipId]` 편집 화면 구조 및 문구 정리
- 관련 E2E 기대값 갱신

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `src/app/upload/page.tsx`
- `src/components/upload/UploadProcessingView.tsx`
- `src/components/upload/SelectView.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 구현 원칙
- 편집 항목은 모두 선택사항으로 노출한다.
- 한 화면에서 핵심 행동은 1개 또는 2개만 두고, 나머지는 숨기거나 접는다.
- 영어와 기술 용어를 사용자 노출 문구에서 제거한다.
- 선수 정보는 꾸미기보다 가림 방지 원칙을 먼저 안내한다.

### 완료 기준
- 사용자가 업로드 후 바로 편집에 들어가고, 각 편집 항목을 건너뛰어도 저장까지 갈 수 있어야 한다.
- 편집 화면에서 각 도구가 필수가 아니라 선택사항임이 문구와 구조로 드러나야 한다.
- 관련 테스트가 새 문구와 새 단계 이름을 기준으로 통과해야 한다.

## 1단계: 현재 상태를 기준 문서로 고정

### 목표
- 설계 문서, 테스트 기대값, 실제 구현 사이의 불일치를 먼저 드러낸다.

### 해야 할 일
- `docs/app-overview.md`를 현재 엔트리 포인트 기준의 기준 문서로 유지한다.
- `docs/repo-audit.md`를 정리 대상의 근거 문서로 유지한다.
- `docs/UPLOAD-ARCHITECTURE.md`의 상수 설명과 현재 코드 값을 맞춘다.
- `CLAUDE.md` 안의 `/editor/video`, `/upload/child/[id]` 설명을 실제 구현 기준으로 정리한다.

### 완료 기준
- 팀원이 문서만 읽어도 현재 메인 업로드 경로와 비활성 경로를 구분할 수 있어야 한다.

## 1.5단계: 영상 사양 기준 먼저 고정

### 목표
- 구현 확장 전에 Footory 영상 기능의 기준 사양을 먼저 고정한다.
- 선수 프로필 강화 도구라는 제품 DNA를 벗어나지 않도록 범위를 묶는다.
- 현재 `/upload` 스포트라이트 중심 구현과 앞으로 만들 자동 하이라이트 흐름의 차이를 문서로 먼저 정리한다.

### 이번 단계 산출물
- `docs/video-highlight-reference.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`

### 이번 단계에서 문서로 먼저 결정할 것
- 참조 영상에서 따라야 할 인상, 컷 리듬, 텍스트 사용, 선수 어필 방식
- 핵심 사용자와 핵심 플로우
- MVP 편집 기능 우선순위와 비범위
- 원본 저장, 프록시/썸네일, 편집 의사결정 데이터, 최종 렌더링, 실패 복구까지의 미디어 파이프라인

### 주의
- 이 단계에서는 구현을 크게 늘리지 않는다.
- 전문 편집기 수준 기능을 먼저 열지 않는다.
- 배경음악, 과한 전환 효과, 복잡한 멀티트랙 편집은 후순위로 남긴다.

### 완료 기준
- 팀원이 세 문서만 읽고 "무엇을 먼저 만들고 무엇을 나중에 미루는지"를 동일하게 이해할 수 있어야 한다.
- 이후 영상 관련 정리나 구현은 이 세 문서를 기준으로 범위를 판단할 수 있어야 한다.

## 1.6단계: 서브에이전트 운영 기준과 테스트 기준 고정

### 목표
- 영상 기능 확장 전에 누가 어떤 관점으로 판단할지 문서로 먼저 고정한다.
- 제품 DNA 위반, 영상 편집 과기능화, 팀 중심 흐름, 소셜 피드화 위험을 사전에 막는다.
- 실제 사용자 기준 acceptance와 모바일 우선 Playwright 시나리오를 먼저 정의한다.

### 이번 단계 산출물
- `docs/subagents.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`

### 이번 단계에서 문서로 먼저 결정할 것
- `product-guardian`, `video-editor-architect`, `qa-scenario-auditor`의 역할 경계
- 각 서브에이전트가 무엇을 검토하고 무엇은 결정하지 않는지
- 영상 업로드/편집 MVP에서 먼저 만들 UI와 뒤로 미룰 기능
- 모바일 우선 acceptance 기준과 Playwright 회귀 시나리오

### 주의
- 이 단계에서는 구현 범위를 늘리지 않는다.
- 테스트 문서는 현재 코드와 다음 MVP 문서 기준을 분리해서 적는다.
- 팀 기능이나 소셜 기능을 영상 메인 플로우의 중심으로 끌어오지 않는다.

### 완료 기준
- 팀원이 세 문서만 읽고 "어떤 관점으로 검토하고 무엇을 테스트해야 하는지"를 동일하게 이해할 수 있어야 한다.
- 이후 영상 관련 구현과 QA는 위 세 문서를 기준으로 범위와 우선순위를 판단할 수 있어야 한다.

## 1.7단계: 업로드 첫 세로 슬라이스 구현

### 목표
- `/upload` 메인 경로를 유지한 채 문서 기준 첫 번째 세로 슬라이스를 실제 코드로 연결한다.
- 이번 단계는 "원본 업로드 + 처리 상태 노출 + 기본 하이라이트 제안 초안 + 다음 단계 진입"까지만 다룬다.
- 편집 앱화되는 기능을 늘리지 않고, 자동 제안이 기본값인 Video-first 업로드 경험을 먼저 만든다.

### 이번 단계 구현 범위
- 업로드 시작 화면에서 파일 제한과 다음 행동을 더 명확히 노출
- 파일 선택 직후 실제 업로드/준비 시작과 상태 단계 표시
- 업로드 완료 후 기본 하이라이트 제안 데이터 구조 생성
- 자동 제안 컷 목록, 대표 후보, 총 길이를 보여주는 최소 검토 UI
- 사용자가 다음 단계로 이동할 수 있는 최소 CTA 제공

## 1.8단계: single clip playback contract 최소 정렬

### 목표
- clip-first core flow를 기준으로 업로드, 업로드 직후 재생, spotlight/freeze, zoom playback, overlay, 저장이 같은 single clip playback contract를 바라보게 한다.
- 이번 단계에서는 reel highlight 구현으로 확장하지 않고, 현재 `/upload` 메인 경로의 contract mismatch 1개만 최소 범위로 정리한다.

### 이번 단계에서 먼저 고를 문제
- `/upload` review/save 단계가 single clip 재생 계약이 아니라 별도 highlight draft 모델을 기준으로 움직이는지 확인한다.
- 저장 payload와 런타임 재생 소비 경로가 서로 다른 길이, spotlight, overlay 필드를 쓰는지 실제 코드 기준으로 확인한다.
- 위 둘 중 single clip core flow를 가장 크게 흔드는 불일치 1개만 선택한다.

### 이번 단계에서 확정한 핵심 불일치
- `HighlightSuggestionReview`와 `saveHighlightDraft()`는 여러 제안 컷을 검토하게 하지만, 저장 시 단일 clip playback contract가 아닌 `최초 시작 ~ 마지막 종료` 합집합 범위를 `trim_start`, `trim_end`, `duration_sec`로 밀어 넣고 있다.
- 반면 현재 런타임 재생기는 single clip의 연속 playback window만 소비하므로, 저장 후 재생 결과가 검토 화면의 대표 컷과 어긋난다.
- 따라서 이번 단계에서는 "대표 playback cut 1개"를 single clip canonical contract로 고정하고, review/save/playback이 그 계약을 같이 쓰도록 맞춘다.

### 구현 원칙
- 새 기능 추가 금지
- 큰 UI 개편 금지
- `clips` 메타데이터 기반 클라이언트 재생 구조 유지
- reel, multi-clip highlight, render/export 쪽으로 범위 확장 금지
- 통일된 타입 또는 모델을 먼저 만들고 업로드/저장/재생 소비 경로를 그 모델로 맞춘다

### 완료 기준
- single clip playback contract가 타입과 저장 payload에서 하나로 설명된다.
- `/upload` 메인 경로와 현재 재생 경로가 같은 필드 묶음을 기준으로 동작한다.
- 해결한 acceptance 항목과 남은 mismatch 우선순위가 문서/보고에 남는다.

### 이번 단계 비범위
- 과한 타임라인 편집기
- 복잡한 효과 설정
- 배경음악
- 자막 자동 생성
- 소셜 공유 기능

### 기존 코드 재사용 원칙
- `src/app/upload/page.tsx`, `src/components/upload/SelectView.tsx`, `src/lib/upload-service.ts`를 우선 재사용한다.
- 현재 `POST /api/clips` 저장 경로와 background R2 upload 흐름은 유지한다.
- `DecorateView`의 선수 지정/포커스 설정은 이번 슬라이스의 메인 UX에서 제외하되 즉시 삭제하지 않는다.

### 정리 후보 메모
- `src/components/upload/DecorateView.tsx`: 현재 메인 업로드 경로에서 자동 제안 기반 UX로 밀리므로 정리 후보로 유지
- `src/components/upload/DoneView.tsx`의 공유 버튼: 이번 슬라이스 범위 밖이므로 축소 또는 제거 대상
- `tests/e2e/video/video-upload-flow.spec.ts`: 구형 꾸미기/효과/공유 흐름 기대가 남아 있어 이번 슬라이스 기준으로 재작성 필요

### 완료 기준
- 로그인한 선수/부모가 `/upload`에서 영상 업로드를 시작하고 상태를 이해할 수 있어야 한다.
- 업로드 후 기본 하이라이트 제안 초안을 확인하고 다음 단계로 이동할 수 있어야 한다.
- 이번 단계 비범위 기능이 메인 화면의 핵심 결정 흐름을 방해하지 않아야 한다.

## 1.8단계: 업로드 두 번째 세로 슬라이스 구현

### 목표
- 첫 번째 슬라이스에서 만든 자동 제안 초안을 실제 편집 초안으로 이어 붙인다.
- 사용자는 복잡한 편집기가 아니라 "검토 -> 컷 미세 조정 -> 저장"만 빠르게 끝낼 수 있어야 한다.
- 저장 결과를 프로필 `featured` 후보 또는 태그 포트폴리오 연결까지 실제 코드 흐름으로 닫는다.

### 이번 단계 구현 범위
- 기본 하이라이트 제안 결과를 검토하는 메인 화면
- 컷별 시작/끝 시점 미세 조정
- 컷 순서의 최소 이동 기능
- 대표 컷 확인 또는 변경
- 저장 전 프로필 반영 위치 선택
- 저장 시 기존 `clips`, `clip_tags`, `featured_clips` 경로 재사용

### 이번 단계 비범위
- 전문 편집기 수준 멀티트랙 편집
- 과도한 애니메이션
- 복잡한 텍스트 모션
- SNS용 템플릿 다변화
- 새로운 렌더 워커 또는 `/api/render` 중심 흐름 부활

### 재사용 원칙
- 업로드 시작과 원본 저장은 `src/app/upload/page.tsx`, `src/components/upload/SelectView.tsx`, `src/lib/upload-service.ts` 흐름을 유지한다.
- 저장은 새 전용 파이프라인을 만들지 않고 `PATCH /api/clips/[id]`, `POST /api/featured`를 우선 재사용한다.
- 태그 포트폴리오 연결은 기존 `clip_tags` 구조 안에서 처리하고, 새로운 소셜 공유 개념을 이번 단계에 끌어오지 않는다.

### 정리 후보 메모
- `src/components/upload/HighlightSuggestionReview.tsx`: 첫 슬라이스용 handoff 성격이 강하므로 이번 단계에서 실제 편집/저장 화면으로 흡수될 가능성이 높다.
- `src/app/upload/page.tsx` 내부 레거시 phase 정리 로직: `decorate`, `share`, `done`에 의존하는 구간은 메인 플로우 정리 후 삭제 후보로 옮길 수 있다.
- `tests/e2e/video/video-upload-flow.spec.ts`: "다음 단계 준비 완료" handoff 검증은 두 번째 슬라이스 기준으로 재작성 필요.

### 완료 기준
- 로그인한 선수/부모가 `/upload`에서 자동 제안을 보고 컷 시작/끝을 이해 가능한 조작으로 수정할 수 있어야 한다.
- 사용자는 컷 순서를 최소 수준으로 바꾸고 대표 컷을 정한 뒤 저장할 수 있어야 한다.
- 저장 후 결과가 `featured` 후보 또는 태그 포트폴리오 연결로 이어지고, 사용자는 반영 위치를 이해할 수 있어야 한다.
- 메인 화면이 여전히 모바일 우선이고, 한 번에 한 가지 판단만 하게 구성되어야 한다.

## 1.9단계: social-style single clip editing UX 정렬

### 목표
- 1.8단계의 multi-cut review 성격 UI를 single clip playback contract 중심의 social-style editing UX로 다시 정렬한다.
- 사용자는 전문 편집기가 아니라 인스타그램/틱톡처럼 "지금 무엇을 편집하는지"가 보이는 한 화면 편집 경험을 받아야 한다.
- 이번 단계에서는 multi-clip reel highlight로 확장하지 않고 single clip metadata 편집과 저장만 닫는다.

### 이번 단계 구현 범위
- single clip preview 중심 편집 화면
- trim 시작/끝 조절 UI
- spotlight freeze 시점 조절 UI
- zoom playback 배율 조절 UI
- profile card / lower third 토글 또는 최소 편집 UI
- highlight range 시작/끝 조절 UI
- 현재 `clips` 메타데이터 계약을 재사용하는 저장 흐름

### 이번 단계 비범위
- 여러 제안 컷을 순서대로 재배치하는 multi-cut review
- multi-clip reel highlight
- 멀티트랙 타임라인
- 서버 render/export 복귀
- 배경음악, 캡션, 필터 마켓

### 상태 구조 원칙
- 편집 상태의 canonical source는 single clip playback contract여야 한다.
- trim, highlight range, spotlight/freeze, zoom, overlay visibility가 한 draft/state 안에 같이 있어야 한다.
- 저장 payload와 preview 소비 필드는 같은 state를 읽어야 한다.

### 재사용 원칙
- 업로드 시작과 원본 저장은 기존 `/upload` 및 `startUpload()` 흐름을 유지한다.
- 재생 미리보기는 기존 spotlight/zoom/overlay 소비 유틸을 최대한 재사용한다.
- 저장은 새 엔티티를 만들지 않고 `PATCH /api/clips/[id]`와 기존 프로필 연결 경로를 우선 확장한다.

### 완료 기준
- 사용자가 `/upload`에서 업로드 후 바로 single clip preview를 보며 trim, spotlight freeze, zoom, overlay, highlight range를 조정할 수 있어야 한다.
- 화면 수가 늘지 않고, 현재 편집 대상이 clip 하나라는 점이 UI에서 분명해야 한다.
- 저장 후 현재 재생 경로가 같은 메타데이터 묶음을 소비해야 한다.

## 1.10단계: 영상 draft/project persistence 안정화

### 목표
- single clip editing 상태와 reel highlight draft를 서버에 저장 가능한 최소 구조로 정리한다.
- 사용자가 탭 이탈, 새로고침, 모바일 브라우저 메모리 정리 후 다시 들어와도 마지막 draft를 복구할 수 있어야 한다.
- 현재 `clips` 메타데이터 기반 runtime playback contract는 유지하고, 그 위에 draft/project 레이어만 추가한다.

### 이번 단계 구현 범위
- single clip draft 저장
- reel highlight draft 저장
- draft 다시 열기
- draft 수정 후 재저장
- publish 전 상태와 published 상태 구분

### 이번 단계 모델 원칙
- `clips`는 published single clip playback metadata의 기준 엔티티로 유지한다.
- `highlights`는 published 또는 publish-ready reel 엔티티로 유지한다.
- draft/project는 별도 레이어에서 관리하고, published metadata를 덮어쓰지 않은 상태에서도 저장 가능해야 한다.
- single clip draft와 reel draft는 공통 project 레이어를 쓰되 payload shape는 타입으로 분리한다.
- publish는 draft를 published entity에 반영하는 단계로 보고, draft 저장과 같은 요청으로 섞지 않는다.

### 이번 단계 구현 순서
1. 현재 `clips`, `highlights`, `/upload`, `/reel/create`, 관련 API의 저장 구조를 실제 코드 기준으로 점검한다.
2. 부족한 최소 범위의 draft/project 모델과 migration을 추가한다.
3. single clip 편집 진입 시 기존 draft 복구 흐름을 붙인다.
4. reel highlight 생성/수정 시 draft reopen/save 흐름을 붙인다.
5. acceptance 문서와 ship blocker 문서를 저장/복구 기준으로 갱신한다.

### 이번 단계 비범위
- multi-clip 서버 렌더 export
- render worker 재가동
- 장기 버전 히스토리
- 협업 편집
- 자동 publish

### 완료 기준
- single clip과 reel highlight 모두 서버에 draft를 저장할 수 있어야 한다.
- 같은 사용자가 재진입하면 가장 최근 draft를 다시 열 수 있어야 한다.
- publish 전 상태와 published 상태가 모델과 API에서 구분되어야 한다.
- 현재 share/profile/reel playback contract는 draft 레이어 추가로 깨지지 않아야 한다.

## 1.11단계: publish/profile 연결 안정화

### 목표
- single clip과 reel highlight가 "편집 결과물"에 머물지 않고 실제 선수 프로필 자산으로 연결되게 한다.
- public profile, clip share, reel share가 draft를 노출하지 않도록 publish 기준을 현재 구조 안에서 잠근다.
- featured, tag portfolio, reel publish 상태를 같은 제품 언어로 정리한다.

### 이번 단계 구현 범위
- single clip publish를 `featured_clips` 또는 `clip_tags` 연결로 해석하는 상태 정리
- public profile에서 published clip asset만 노출되도록 필터링
- public clip share에서 profile asset으로 연결된 clip만 노출
- reel highlight의 `draft` / `published` 상태 정리
- profile reel 목록에서 publish / unpublish / republish 액션 제공
- public reel share에서 published reel만 노출
- player info overlay가 실제 profile 정보와 같은 source를 읽는지 점검하고 필요한 최소 보정

### 이번 단계 비범위
- 새 소셜 피드 개념 추가
- team 중심 reel 분류
- 별도 render/export 파이프라인 복귀
- draft/project 저장 구조 전면 재설계

### 상태 해석 원칙
- single clip의 기본 엔티티는 계속 `clips`다.
- single clip이 profile asset으로 publish된 상태는 `featured_clips` 또는 `clip_tags`에 연결된 상태로 본다.
- featured와 tag portfolio 둘 다 끊기면 single clip은 public profile 기준 unpublished 상태로 본다.
- reel highlight는 `highlights.status`의 `draft`와 `published`를 기준으로 관리한다.
- republish는 기존에 public 노출되던 자산을 다시 profile asset으로 연결하거나, reel을 다시 `published`로 전환하는 동작으로 본다.

### 완료 기준
- 사용자가 single clip을 저장하면 profile featured 또는 tag portfolio 자산으로 연결되고 public profile/share에서 같은 기준으로 소비된다.
- 사용자가 reel을 저장하면 draft로 남고, profile에서 publish 후 public share가 가능해야 한다.
- public 경로가 unpublished clip/reel을 임의로 노출하지 않아야 한다.
- publish / unpublish / republish 용어와 동작이 profile 화면과 API 응답에서 서로 어긋나지 않아야 한다.

## 2단계: 즉시 정리 가능한 저위험 항목 정리

### 목표
- 현재 제품 흐름에 연결되지 않은 산출물과 구형 조각을 먼저 제거한다.
- 이번 배치는 영상 핵심 흐름인 `업로드 -> 상태 표시 -> 기본 제안 -> 컷 조정 -> 저장 -> 프로필 연결 후보`를 건드리지 않는 파일만 다룬다.

### 2-0단계: cleanup scan only

#### 목표
- 실제 삭제나 리팩터링 없이 현재 저장소의 정리 후보만 다시 스캔한다.
- `삭제 후보`, `통합 후보`, `보류 후보`를 실제 import, 라우트, 테스트 연결 기준으로 다시 분류한다.
- 영상 핵심 플로우와 직접 연결된 파일/영역은 별도 표기로 잠가서 성급한 정리를 막는다.

#### 이번 단계 산출물
- `docs/deletion-candidates.md`

#### 이번 단계에서 반드시 확인할 것
- `docs/deletion-candidates.md`
- `docs/refactor-rules.md`
- `docs/stabilization-report.md`
- `docs/implementation-gap.md`
- `src/app/upload/page.tsx`
- `src/components/upload/*`
- `src/lib/upload-service.ts`
- `src/stores/upload-store.ts`
- `src/app/api/clips/[id]/route.ts`
- `src/components/player/ClipPlayerSheet.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`
- `tests/e2e/video/*.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`

#### 해야 할 일
- 현재 워크트리에서 이미 삭제된 파일과 아직 남아 있는 레거시 파일을 구분해서 기록한다.
- import가 없더라도 store 필드나 API 계약을 통해 핵심 플로우와 간접 결합된 영역은 `보류`로 둔다.
- 부모 업로드, 공유 플레이어, 프로필/피드 재생처럼 업로드 이후 소비 경로를 같이 추적한다.
- 이번 단계에서는 코드 삭제, 파일 이동, 통합 작업을 하지 않는다.

#### 완료 기준
- 팀원이 `docs/deletion-candidates.md`만 보고 바로 정리 가능한 후보와 손대면 위험한 영역을 구분할 수 있어야 한다.
- `바로 삭제`와 `실제 미사용처럼 보이지만 보류`가 호출 근거와 함께 분리되어 있어야 한다.

### 우선 대상
- 루트의 Playwright 스냅샷 산출물
- import가 없는 공용 UI와 보조 컴포넌트
- 현재 `/upload`에서 사용하지 않는 구형 업로드 탭 조각

### 후보
- `playwright-login-snapshot.md`
- `playwright-login-snapshot2.md`
- `playwright-profile-snapshot.md`
- `playwright-profile-snapshot3.md`
- `playwright-reel-after-preview.md`
- `src/components/upload/ShareView.tsx`
- `src/components/upload/CaptionTab.tsx`
- `src/components/upload/SlowmoTab.tsx`
- `src/components/upload/BgmSelector.tsx`
- `src/components/upload/guide/CoachMark.tsx`
- `src/components/video/CaptionOverlay.tsx`
- `src/components/video/EffectsToggle.tsx`
- `src/components/profile/ProfileCompletionGuide.tsx`
- `src/components/player/ProfileSkeleton.tsx`
- `src/components/ui/EmptyCTA.tsx`
- `src/lib/hud-canvas-renderer.ts`
- `src/lib/skill-labels.ts`

### 완료 기준
- 삭제 후 `lint`, `typecheck`, `test:run`이 모두 통과한다.
- 남은 업로드 플로우와 프로필 재생 기능이 동작한다.

### 2-1차 배치: 2026-04-09 실제 정리 범위

#### 이번 배치에서 바로 지울 대상
- `src/components/upload/ShareView.tsx`
- `src/components/upload/CaptionTab.tsx`
- `src/components/upload/SlowmoTab.tsx`
- `src/components/upload/BgmSelector.tsx`
- `src/components/upload/guide/CoachMark.tsx`
- `src/components/video/CaptionOverlay.tsx`
- `src/components/video/EffectsToggle.tsx`
- `src/components/profile/ProfileCompletionGuide.tsx`
- `src/components/player/ProfileSkeleton.tsx`
- `src/components/ui/EmptyCTA.tsx`
- `src/lib/hud-canvas-renderer.ts`

#### 즉시 삭제 근거
- `src/app/upload/page.tsx`는 현재 `SelectView -> UploadProcessingView -> HighlightSuggestionReview`만 사용한다.
- 위 파일들은 `rg` 기준 현재 `src/`, `tests/`에서 import 또는 라우트 연결이 확인되지 않았다.
- 기능 성격도 문서 기준 현재 MVP 비범위인 배경음악, 캡션, 슬로모션, 과한 효과, 구형 공유 단계, 미사용 보조 UI에 해당한다.

#### 이번 배치에서 보류할 대상
- `/api/render/*`, `src/hooks/useGlobalRenderPolling.ts`, `startRenderUpload()` 관련 경로
- `src/app/edit/[clipId]/page.tsx`, `src/lib/highlight-generator.ts`
- `src/lib/skill-labels.ts`
- `src/components/upload/VideoSelector.tsx`, `src/components/upload/TagMemoForm.tsx`
- `src/stores/upload-store.ts`의 레거시 상태 필드 일괄 정리

#### 보류 근거
- `/api/render/*`는 `AppShell`과 테스트에서 아직 호출 흔적이 남아 있다.
- `/edit/[clipId]`는 라우트가 살아 있고 동적 import 경로가 남아 있다.
- `src/lib/skill-labels.ts`는 런타임 호출은 없지만 단위 테스트가 남아 있다.
- `VideoSelector`와 `TagMemoForm`은 부모 업로드 쪽 중복 정리 후보지만 아직 실제 호출 경로 확인과 통합 설계가 더 필요하다.
- 업로드 스토어의 레거시 상태는 메인 흐름 외 경로와 얽혀 있어 이번 배치처럼 파일 단위로 안전하게 자르기 어렵다.

### 2-2차 배치: 2026-04-10 lint 차단 해소

#### 이번 배치 목표
- 저위험 정리 이후 남아 있는 전역 lint 에러 중 작은 범위 수정으로 풀 수 있는 항목부터 해소한다.
- 영상 핵심 흐름과 직접 관련된 파일은 동작 변경 없이 규칙 위반만 줄인다.

#### 이번 배치 대상
- `src/components/feed/FeedCard.tsx`
- `src/hooks/useGlobalRenderPolling.ts`
- `src/components/upload/GlobalUploadIndicator.tsx`
- `src/components/upload/DecorateView.tsx`

#### 이번 배치 원칙
- 기능 추가나 UX 변경 없이 lint 에러를 없애는 수준으로만 수정한다.
- `DecorateView`는 현재 메인 업로드 경로 밖이므로 구조 개편 대신 의존성 정합성만 맞춘다.
- lint 통과 후 나머지 warning은 별도 배치로 나눈다.

### 2-3차 배치: 2026-04-10 안전 정리(미사용/실험 산출물 한정)

#### 이번 배치 목표
- 영상 핵심 플로우에 직접 연결되지 않은 미사용 코드와 실험 산출물만 제거한다.
- 삭제보다 통합 우선 원칙을 유지하되, 이번 배치는 호출 근거가 0건인 파일만 다룬다.

#### 이번 배치 대상(실행 예정)
- 루트 실험 산출물
  - `playwright-login-snapshot.md`
  - `playwright-login-snapshot2.md`
  - `playwright-profile-snapshot.md`
  - `playwright-profile-snapshot3.md`
  - `playwright-reel-after-preview.md`
- 미사용 완료 화면
  - `src/components/upload/DoneView.tsx`
  - `src/components/editor/video/DoneView.tsx`

#### 이번 배치 보류 대상
- `src/components/upload/DecorateView.tsx`
- `src/stores/upload-store.ts` 레거시 필드 정리
- `src/lib/upload-service.ts` reset/cancel 및 render 관련 분기
- share/reel/profile 재생 계약 관련 파일 일체

#### 실행 근거
- `rg -n` 기준 위 대상은 `src/`, `tests/`에서 import/호출 흔적이 없다.
- 반면 보류 대상은 ship blocker 문서에서 핵심 플로우 리스크로 명시되어 있어 이번 배치에서 제외한다.

#### 완료 기준
- 코드/문서 정리 후 `npm run lint`, `npm run typecheck`, `npm run test:run` 통과.
- `docs/deletion-candidates.md`에 실행 완료/보류를 명시.

## 3단계: 영상 메인 경로 하나로 정리

### 목표
- 영상 업로드와 편집의 주 경로를 하나로 명확히 한다.

### 현재 판단
- 현재 사용자 메인 경로는 `/upload` 기반 2단계 위저드다.
- 서버 렌더 파이프라인과 구형 편집 경로는 주변에 남아 있지만 메인 진입점이 아니다.

### 결정이 필요한 항목
- `startUpload()` 중심 흐름을 유지할지
- `startRenderUpload()`와 `/api/render`를 되살릴지
- `/edit/[clipId]`와 `highlight-generator`를 유지할지
- 관리자용 `video-lab`을 서비스 핵심과 분리해 둘지

### 추천 순서
1. 현재 제품이 런타임 오버레이 방식으로 충분한지 결정한다.
2. 그렇다면 `/api/render`, `render-worker/`, `startRenderUpload()`는 별도 실험 영역으로 격리하거나 제거한다.
3. `/edit/[clipId]`와 구형 에디터 컴포넌트는 연결이 끊긴 상태이므로 제거 후보로 넘긴다.

### 완료 기준
- 영상 생성/편집/재생 관련 주 경로가 문서와 코드 모두에서 하나로 설명된다.

## 4단계: 구형 편집 스택 정리

### 목표
- 리다이렉트만 남은 경로와 그 하위 컴포넌트 묶음을 제거한다.

### 대상
- `src/app/editor/video/page.tsx`
- `src/app/upload/child/[id]/page.tsx`
- `src/components/editor/video/` 중 현재 재사용되지 않는 파일

### 주의
- `PinchZoomVideo.tsx`와 `types.ts`는 현재 업로드 플로우가 사용하므로 제외해야 한다.
- 삭제 전 `rg`로 마지막 호출 여부를 다시 확인한다.

### 완료 기준
- `src/components/editor/video/`는 실제 재사용 파일만 남는다.
- 경로 이름과 실제 동작이 어긋나는 페이지가 사라진다.

## 5단계: 업로드 코드 중복 제거

### 목표
- 부모 업로드와 일반 업로드가 중복으로 들고 있는 presign, 업로드, 썸네일 흐름을 줄인다.

### 정리 방향
- `ParentQuickUpload`가 `upload-service` 공용 함수 또는 공용 서버 액션을 더 많이 재사용하도록 바꾼다.
- `VideoSelector`와 `SelectView`의 역할을 분리하거나 공통 파일 선택 유틸을 뽑는다.
- 썸네일 업로드 코드가 한 곳에서 관리되도록 맞춘다.

### 완료 기준
- presign, R2 업로드, 썸네일 업로드, 클립 저장이 최소한의 경로만 통과한다.

## 6단계: 테스트와 acceptance 정리

### 목표
- 현재 구현과 맞지 않는 테스트를 다시 기준으로 만든다.

### 우선 대상
- `tests/e2e/video/video-upload-flow.spec.ts`
- `tests/e2e/upload-wizard.spec.ts`
- 영상 관련 acceptance 문서 신설

### 해야 할 일
- 현재 `/upload` 2단계 위저드와 부모 업로드를 기준으로 E2E를 다시 쓴다.
- `DecorateView`의 현재 UI와 실제 버튼/텍스트를 기준으로 테스트를 맞춘다.
- 전용 reference spec과 acceptance 문서를 `specs/` 또는 `docs/` 아래에 만든다.
- `docs/testing/video-highlight-acceptance.md`를 제품 acceptance 기준 문서로 유지한다.
- `docs/testing/playwright-scenarios.md`를 모바일 우선 회귀 시나리오 기준 문서로 유지한다.

### 완료 기준
- 영상 변경 전 확인해야 할 문서와 테스트 위치가 명확해진다.

## 우선순위 정리

### 먼저 해도 되는 것
- 추적되지 않는 스냅샷 산출물 정리
- import가 없는 보조 컴포넌트 정리
- 문서와 테스트의 현재 상태 맞춤

### 확인 후 지워야 하는 것
- `/edit/[clipId]`
- `/api/render/*`
- `render-worker/`
- `src/app/upload/child/[id]/page.tsx`
- `src/components/editor/video/`의 구형 편집 스택

### 마지막에 해야 하는 것
- 부모 업로드와 일반 업로드의 서비스 통합
- 재생 로직 공통화

## 작업 시작 체크리스트
- `docs/repo-audit.md`를 다시 읽었는가
- 이번 정리 대상이 `현재 사용 중`인지 `실험 흔적`인지 다시 확인했는가
- 영상 관련이면 현재 reference spec과 acceptance 근거를 먼저 확인했는가
- 삭제 전에 `lint`, `typecheck`, `test:run`, 필요한 E2E 범위를 계획했는가

## 0.10단계: ship blocker 상위 2개 순차 해결 (2026-04-10)

### 목표
- 남은 ship blocker 전체가 아니라 우선순위 상위 2개만 순차적으로 해결한다.
- 최소 수정으로 안정성을 복구하고 범위 확장을 막는다.

### 작업 범위
1. blocker 1: 업로드 중 reset/cancel과 실제 upload abort 원자성 보강
2. 검증 1차: `npm run lint`, `npm run typecheck`, `npm run test:run`
3. blocker 2: `src/app/api/video-projects/route.ts` 타입 오류 3건 해결
4. 검증 2차: `npm run lint`, `npm run typecheck`, `npm run test:run`
5. 문서 갱신: `docs/ship-blockers.md`, `docs/testing/video-validation-report.md`, `docs/release-readiness.md`

### 금지 범위
- blocker 3, 4, 5 해결 시도 금지
- share/reel/profile playback contract 대수술 금지
- upload-store 구조 개편 금지
- cleanup 대수술 금지
- 새 기능 추가 금지
- render 관련 복귀 작업 금지

### 완료 기준
- blocker 1과 blocker 2 해결 여부를 코드와 검증 결과로 설명할 수 있어야 한다.
- 2회 검증 결과와 남은 blocker 상태가 release 문서 3종에 반영되어 있어야 한다.

## 0.10단계: Blocker 0 업로드 후 편집 진입 복구

### 목표
- 짧은 clip 업로드 완료 후 사용자가 반드시 편집 화면으로 진입할 수 있게 복구한다.
- 이번 단계는 `docs/ship-blockers.md`의 신규 blocker 0만 다루고, 다른 영상 구조 문제는 건드리지 않는다.

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/ship-blockers.md`
- `docs/release-readiness.md`
- `docs/testing/video-validation-report.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/testing/video-highlight-acceptance.md`
- 실제 `/upload`, `/edit/[clipId]`, upload store, single clip draft 저장/복구 코드
- 관련 Playwright video upload 시나리오

### 해야 할 일
- 실제 코드 기준으로 업로드 후 편집 진입을 막는 원인 1개를 특정한다.
- 최소 범위 수정으로 업로드 완료 상태에서 편집 CTA 또는 자동 전환을 제공한다.
- editor route가 `clipId`와 가능한 `projectId`를 받아 정상 진입하도록 맞춘다.
- 업로드 후 편집 화면 진입 가능 여부만 검증하는 Playwright smoke test를 추가 또는 갱신한다.
- `npm run lint`, `npm run typecheck`, `npm run test:run`과 필요한 범위의 Playwright 검증을 실행한다.
- 결과를 `docs/ship-blockers.md`, `docs/testing/video-validation-report.md`에 반영한다.

### 이번 단계에서 하지 말 것
- playback contract 대수술
- upload-store 구조 개편
- publish/profile 연결 수정
- reel highlight 작업
- cleanup 작업

## 0.11단계: 업로드 진행 표현 및 단일 영상 편집 UX 단순화 (2026-04-10)

### 목표
- `/upload`의 업로드 진행 화면과 단일 영상 편집 화면을 실제 사용자 기준으로 다시 단순화한다.
- 업로드 중에는 "지금 어디까지 됐는지"만 바로 읽히게 하고, 업로드 완료 뒤에는 편집할지 바로 저장할지 결정이 쉬워야 한다.
- 편집 화면에서는 영상이 먼저 보여야 하며, 작은 화면에서도 오버레이와 설명 카드가 영상을 가리지 않게 조정한다.

### 작업 배경
- 현재 `UploadProcessingView`는 `1. 영상 준비 / 2. 원본 올리기 / 3. 편집 준비`를 세로 카드로 반복 노출해 흐름은 보이지만 사용자가 빠르게 이해하기 어렵다.
- 현재 `HighlightSuggestionReview`와 `SingleClipEditorPreview`는 영상 위 배지, 하단 요약, 다수 설명 카드가 먼저 보여 작은 모바일 화면에서 실제 영상 확인이 답답하다.
- 사용자 피드백 기준으로 업로드 완료 후 다음 행동이 불명확하고, 편집 문구가 많아 처음 쓰는 사람에게 오히려 방해가 된다.

### 이번 단계에서 반드시 확인할 것
- `AGENTS.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- 실제 `/upload`, `/edit/[clipId]`, `UploadProcessingView`, `HighlightSuggestionReview`, `SingleClipEditorPreview`
- `tests/e2e/video/video-upload-flow.spec.ts`
- 테스트용 `tests/fixtures/videos/test2.mp4`

### 해야 할 일
- 업로드 진행 UI를 세로 3단계 나열 대신 연결형 진행 표현이나 체크형 상태 표현 중심으로 재구성한다.
- 업로드 완료 직후 CTA를 정리해 "편집 계속"과 "바로 저장" 중 핵심 선택만 남긴다.
- 편집 화면 상단 설명, 안내 카드, 저장 영역 문구를 줄여 한 화면에서 행동 1~2개만 읽히게 만든다.
- `SingleClipEditorPreview`에서 영상 가시 영역을 우선 확보하고, 오버레이와 HUD는 safe area 안에서 더 작고 덜 공격적으로 보이게 조정한다.
- 1차 단순화 뒤에도 모바일 하단 액션 바가 잘리거나 단계 설명이 다시 길어지는 지점을 한 번 더 줄인다.
- 상시 문구를 줄이는 대신 처음 한 번만 보이는 짧은 온보딩 힌트로 핵심 조작 순서를 안내한다.
- trim 조절은 시작/끝 개별 슬라이더 대신 하나의 range 형태로 재구성해 현재 선택 구간을 한 번에 이해하게 만든다.
- `주인공` 단계에서는 정지 상태 오버레이가 선택을 가리지 않게 하고, `고정 시점`은 "지금 장면 고정" 같은 행동 중심 문구로 바꾼다.
- 프로필 카드는 단일 영상 편집 기본값에서 항상 보이도록 되돌리고, 마지막 저장 뒤에는 다음 화면으로 명확히 이동시킨다.
- Playwright MCP와 관련 E2E로 `test2.mp4` 기준 반복 수동 검증을 수행하고, 불편·혼란·비효율 항목을 수정 뒤 다시 확인한다.
- 필요한 경우 업로드/편집 관련 Playwright 시나리오를 현재 UX 기준으로 갱신한다.
- 최종적으로 `npm run lint`, `npm run typecheck`, `npm run test:run`과 관련 Playwright 검증을 실행한다.

### 이번 단계에서 하지 말 것
- clip-first 제품 방향 변경
- reel highlight 또는 phase 2 기능 확장
- 업로드 서비스/저장 계약 대수술
- profile publish 계약 재설계
- 영상 재생 엔진 자체 교체

### 완료 기준
- 사용자가 업로드 중 현재 상태를 한눈에 이해할 수 있어야 한다.
- 업로드 완료 뒤 다음 행동이 1~2개 수준으로 정리되어 있어야 한다.
- 단일 영상 편집 첫 화면에서 영상이 가장 먼저 크게 보여야 한다.
- 작은 모바일 화면에서도 주요 CTA와 프리뷰가 함께 보이고 서로 가리지 않아야 한다.
- `test2.mp4` 기준 반복 검증과 자동 검증 결과로 개선 내용을 설명할 수 있어야 한다.

## 0.12단계: single-clip 편집 저장/복구 안정화 (2026-04-10)

### 목표
- single-clip 편집 화면에서 실제로 바꿀 수 있는 값이 서버 draft에 저장되고 재진입 시 복구되도록 안정화한다.
- 이번 단계는 reel highlight, publish/profile 확장, cleanup 확대 없이 single-clip draft 흐름만 다룬다.

### 이번 단계에서 반드시 확인할 것
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/video-validation-report.md`
- `src/app/upload/page.tsx`
- `src/app/edit/[clipId]/page.tsx`
- `src/components/upload/HighlightSuggestionReview.tsx`
- `src/lib/single-clip-playback.ts`
- `src/lib/highlight-save.ts`
- `src/lib/video-projects.ts`
- `src/app/api/video-projects/route.ts`
- `src/app/api/video-projects/[id]/route.ts`
- `tests/e2e/video/video-upload-flow.spec.ts`

### 해야 할 일
- `video_projects`의 `single_clip` draft 저장 구조와 `clips` publish patch 흐름을 실제 코드 기준으로 다시 점검한다.
- trim, spotlight, zoom, player info overlay, highlight range, save target 중 현재 UI에서 실제 편집 가능한 값만 저장/복구 대상으로 고정한다.
- `/upload` 재진입 복구와 `/edit/[clipId]` 직접 재진입 복구를 최소 범위로 맞춘다.
- Playwright에 `업로드 -> 편집 -> 값 변경 -> 저장 또는 재진입 -> 복구` 시나리오를 추가 또는 갱신한다.
- `docs/ship-blockers.md`, `docs/testing/video-validation-report.md`에 이번 단계 결과와 남은 blocker를 반영한다.
- 최종적으로 `npm run lint`, `npm run typecheck`, `npm run test:run`, 관련 Playwright 실행 결과를 기록한다.

### 이번 단계에서 하지 말 것
- reel highlight 저장/복구 확장
- publish/profile 기능 범위 확장
- upload/store 구조 전체 cleanup 확대

### 완료 기준
- single-clip 편집에서 바꾼 값이 autosave draft 또는 저장 결과로 다시 열었을 때 복구된다.
- 모바일 Playwright에서 `업로드 -> 편집 -> 변경 -> 재진입 -> 복구` 흐름이 통과한다.
- 저장되는 값, 복구되는 값, 남은 blocker를 문서와 실행 결과로 설명할 수 있어야 한다.
