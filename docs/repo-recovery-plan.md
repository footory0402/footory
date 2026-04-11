# Footory 저장소 현재 실행 계획

> Last updated: 2026-04-11
> 목적: Codex와 작업자가 지금 해야 할 일만 빠르게 파악하는 운영용 계획 문서
> 원칙: 실제 코드 우선, 현재 배치 우선, 완료 이력은 별도 로그로 분리

## 이 문서의 역할

- 이 문서는 `현재 실행 계획`만 다룬다.
- 완료된 배치, 세부 회고, 과거 blocker 처리 기록은 `docs/recovery-log.md`로 본다.
- 문서 분류와 archive 기준은 `docs/docs-classification.md`를 기준으로 본다.
- 현재 출시 가능 여부와 사용자 영향은 `docs/release-readiness.md`, `docs/ship-blockers.md`를 기준으로 본다.

## 문서 분리 기준

### current plan

- 지금 열려 있는 목표
- 지금 막고 있는 blocker
- 이번 배치 범위와 금지 사항
- 완료 조건과 다음 액션

### history/log

- 완료된 단계별 기록
- 날짜별 배치 로그
- 해결 완료 blocker 메모
- 당시 검증 결과와 회고
- 위치: `docs/recovery-log.md`

### archive/reference

- 긴 배경 설명
- 현재 판단의 근거 문서
- 삭제 후보 근거표
- 구현-문서 불일치 분석
- validation 실행 상세 로그

## 현재 상태 요약

- 제품 핵심 방향은 유지한다. clip-first, 빠른 업로드, 즉시 재생, 선수 포트폴리오 강화가 기준이다.
- `docs/ship-blockers.md` 기준 현재 `Blocker`는 없다.
- 하지만 `docs/release-readiness.md` 기준 현재 상태는 아직 `shipping ready 아님`이다.
- 남은 위험은 작은 화면 회귀 강도, 느린 네트워크/복귀 조합 검증, 로컬 preview와 원격 재생 자산 검증 분리, featured 저장의 완전 원자성 미보장이다.
- 문서 쪽에서는 `docs/repo-recovery-plan.md`가 실행 계획, 로그, 참고 설명을 한 파일에 모두 누적해 탐색 비용이 너무 커졌다.

## 문서 정책 변경 배치 (2026-04-11)

- 대상: `AGENTS.md`, `docs/video-ux-principles.md`, `docs/video-upload-editing-spec.md`, `docs/video-edit-flow.md`
- 변경 이유: 업로드 화면에 선수 프로필 편집/저장 기능을 함께 둘 수 없다는 제약을 제거해, 화면 구성 실험과 구현 선택 폭을 열어 둔다.
- 변경 범위: `한 화면 핵심 행동 1~2개`, `한 화면 한 가지 판단`, `기본 재생과 선택 편집 강제 분리`, `업로드 화면에서 선수 정보 입력 숨김` 계열 문구 삭제 또는 비강제 문구로 전환.
- 비범위: clip-first, optional editing, playback/storage 계약(`clips` 메타데이터, trim/highlight 필드 등)은 유지한다.

## 업로드·편집 플로우 문서 정렬 배치 (2026-04-11)

- 대상: `docs/video-ux-principles.md`, `docs/video-upload-editing-spec.md`, `docs/video-edit-flow.md`, `docs/video-copy-guidelines.md`
- 변경 이유: 메인 업로드는 `선수 프로필 편집`과 `영상 선택`을 함께 두고, 영상 편집은 `영상 선택 후 필요 시 편집하고 저장`하는 흐름으로 더 유연하게 정의한다.
- 변경 범위: `업로드 직후 바로 편집` 기본 전제 제거, `이대로 저장 / 편집하고 저장` 선택 단계 명시, 기본 편집 도구를 `주인공 선택`, `구간 자르기`, `프로필카드 표시`, `하단 선수정보 표시` 중심으로 재정리한다.
- 비범위: 전체 프로필 편집을 영상 편집 안으로 합치지 않으며, clip 저장 계약과 playback 계약은 유지한다.

## 공통 업로드·편집 프로세스 단일화 배치 (2026-04-11)

- 대상: `src/app/upload/page.tsx`, `src/components/upload/UploadProcessingView.tsx`, `src/components/upload/HighlightSuggestionReview.tsx`, `src/components/parent/ParentQuickUpload.tsx`, `src/components/parent/ChildDashboard.tsx`, `tests/e2e/video/video-upload-flow.spec.ts`
- 변경 이유: 선수와 부모가 서로 다른 업로드 UI를 타고, 업로드 뒤 자동 편집 초안 생성과 저장 전 추가 선택이 남아 있어 핵심 흐름 `영상 선택 -> 업로드 -> 저장 또는 편집 -> 저장`이 흐려진다.
- 변경 범위: 부모/선수 모두 같은 `/upload` 흐름을 사용하게 정리하고, 업로드 상태를 `select -> processing -> choice -> edit`로 단순화하며, 저장 전 `저장 위치/태그` 같은 부가 결정을 기본 흐름에서 제거한다.
- 비범위: `clips` 저장 계약, `spotlight/trim/freeze` 재생 계약, 업로드 API의 내부 role 처리 방식 자체를 새로 설계하지는 않는다.

## 확대 재생 UX 정리 배치 (2026-04-11)

- 대상: `docs/video-upload-editing-spec.md`, `docs/media-pipeline.md`, `src/components/upload/HighlightSuggestionReview.tsx`, `src/components/upload/SingleClipEditorPreview.tsx`, `src/components/player/ClipPlayerSheet.tsx`, 관련 video/upload E2E
- 변경 이유: 현재 `주인공 선택 후 자동 확대`와 `재생 중 수동 패닝`이 함께 존재해 사용자가 `주인공 강조 결과를 본다`보다 `직접 카메라를 다시 움직인다`로 이해할 위험이 있다.
- 변경 범위: 확대 재생을 `주인공 강조 안의 고정 확대`로 고정하고, 추적형 확대/다중 포인트 편집/재생 중 수동 패닝을 기본 경험에서 제외한다.
- 비범위: 선수 자동 추적, 키프레임 팬/줌 편집, 구간별 확대 저장, `effects.trackingPoints` 기반 사용자 편집 기능 복귀

## 모바일 카드 에디터 압축 배치 (2026-04-11)

- 대상: `src/app/editor/page.tsx`, `src/components/editor/CardPreview.tsx`, `src/components/editor/EditorForm.tsx`, `tests/e2e/video/profile-card-editor.spec.ts`
- 변경 이유: 모바일 기준에서 `/editor` 세로 길이가 길고, 상단 카드/사진 영역 균형이 깨지며, 선수 정보 필드가 불필요하게 가로 폭을 크게 차지해 스크롤 피로가 높다.
- 변경 범위: 카드 미리보기 버튼 제거, 상단 카드/사진 레이아웃 모바일 우선 정렬, 선수 정보 필드를 글자수 기반 가변 폭으로 재배치해 높이를 줄인다.
- 검증 범위: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npx playwright test tests/e2e/video/profile-card-editor.spec.ts --project='iPhone 15'`
- 비범위: 카드 데이터 계약, 저장 API, 영상 편집(`single-clip editor`) 로직은 변경하지 않는다.

## 카드 편집 화면 사용자 재배치 배치 (2026-04-11)

- 대상: `src/app/editor/page.tsx`, `src/components/editor/CardPreview.tsx`, `src/components/editor/EditorForm.tsx`, `src/app/editor/editor.css`
- 변경 이유: 카드 편집 화면에서 레이어 우선순위가 약해 사용자가 `지금 결과를 본다 → 사진을 바꾼다 → 정보만 고친다` 흐름을 즉시 읽기 어렵고, `select`가 브라우저 기본 스타일로 보여 화면 톤이 깨진다.
- 변경 범위: 모바일 기준으로 상단 결과 미리보기 카드와 사진 액션을 한 묶음으로 재배치하고, 기본 정보/상세 정보/테마를 섹션 카드로 재정렬하며, `select` 전용 래퍼와 화살표 스타일을 추가한다.
- 검증 범위: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npx playwright test tests/e2e/video/profile-card-editor.spec.ts --project='iPhone 15'`
- 비범위: 카드 템플릿 종류 추가, 저장 API 변경, 영상 편집 플로우 변경은 하지 않는다.

## 현재 목표

### 목표 1. 실행 계획 문서 슬림화 고정

- `docs/repo-recovery-plan.md`를 현재 실행 계획 전용 문서로 유지한다.
- 완료 기록과 긴 이력은 `docs/recovery-log.md`로 분리한다.
- 앞으로 새 배치를 시작할 때는 이 문서에 현재 배치만 추가하고, 완료 즉시 로그로 이동한다.

### 목표 2. release 판단 입력을 짧은 문서 세트로 고정

- 출시 판단은 아래 문서만 순서대로 읽어도 되게 유지한다.
- `docs/ship-blockers.md`
- `docs/release-readiness.md`
- `docs/testing/video-validation-report.md`
- `docs/deletion-candidates.md`
- `docs/implementation-gap.md`

### 목표 3. 현재 남은 위험만 순차 처리

- blocker가 아니라도 출시에 직접 영향을 주는 중요 검증 공백만 다룬다.
- 새 기능 추가보다 현재 핵심 플로우 근거를 닫는 쪽을 우선한다.
- cleanup은 저위험 범위만 유지하고, 결합이 큰 영역은 보류한다.

## 현재 blocker

### 문서 운영 blocker

- `repo-recovery-plan.md`가 현재 계획과 과거 로그를 함께 담아 실제 작업 진입 속도를 늦춘다.
- 문서 역할이 섞여 있어 Codex가 "지금 해야 할 일"보다 "이미 끝난 일"을 더 많이 읽게 된다.

### 출시 판단 blocker는 아님 but 현재 중요 위험

- 320px 전후 작은 화면에서의 고강도 회귀 근거 부족
- 느린 네트워크, 복귀, 단절 혼합 상황 검증 부족
- review 미리보기와 원격 재생 자산 검증 경로 분리
- featured 저장의 부분 성공은 안내되지만 완전 원자성은 아직 아님
- 온보딩/가이드 UI가 모바일 화면 비율과 실제 조작 타깃을 기준으로 검증되지 않아 사용성을 해친다.
- 영상 화면 비율(세로/가로)에 따라 업로드 편집 미리보기와 프로필/공유 재생에서 조작 불가 또는 재생 실패 회귀가 보고됐다.

## 현재 기준 문서

### 최상위 기준

- `AGENTS.md`
- `docs/product-dna.md`
- `docs/feature-scope.md`
- `docs/video-product-decisions.md`

### 구현/UX 기준

- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`

### QA/출시 기준

- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/release-readiness.md`
- `docs/ship-blockers.md`

### 정리/운영 참고

- `docs/deletion-candidates.md`
- `docs/implementation-gap.md`
- `docs/docs-classification.md`
- `docs/testing/video-validation-report.md`
- `docs/recovery-log.md`

## 이번 배치

### 배치명

- 단일 영상 편집 플로우 단순화 및 재생 확대 UX 정리

### 병행 배치명 (ops-console)

- 인프라 사용량 읽기 전용 모니터링 추가
- 운영실 사용 가이드와 항목 설명 추가

### 병행 배치명 (automation)

- Footory agent/skill/plugin 레지스트리 정리
- ops-console에서 로컬 자동화 자산 조회와 사용 진입점 추가

### 이번 배치 목표

- 업로드 단계에서는 `영상 선택 → 업로드` 판단만 남기고, `구간 자르기`는 기본 편집 단계로 옮길지 여부를 사용자 흐름 기준으로 먼저 확정한다.
- 현재 업로드 단계와 편집 단계에 중복된 `구간` 결정을 한 번으로 줄여, 사용자가 같은 판단을 두 번 하지 않게 한다.
- `주인공` 단계는 선수를 한 번 누르면 바로 중심 지정 + 기본 확대가 적용되게 바꾸고, 사용자는 그 상태로 바로 재생해 결과를 확인할 수 있어야 한다.
- `주인공` 단계의 확대는 정지 화면 효과가 아니라 `재생 중에도 이 구도로 본다`는 의미로 설명하되, 사용자가 카메라를 다시 옮기는 편집처럼 느끼지 않게 한다.
- 확대 조정은 `넓게 / 기본 / 가깝게` 중심의 쉬운 선택과 핀치 정도만 허용하고, 추적형 확대나 다중 포인트 지정으로는 확장하지 않는다.
- `freeze`는 기본 흐름의 필수 단계가 아니라, 필요할 때만 켜는 선택 옵션으로 내린다.
- 저장 단계 안에 섞여 있는 `대표 장면만 짧게 다시 보여주기`는 기본 저장 플로우에서 제거하거나 저장 후 선택 제안으로 내린다.
- 편집 가이드는 긴 텍스트 카드 대신, 실제 눌러야 할 영역을 순서대로 보여주는 화면 하이라이트 온보딩으로 바꾼다.
- 온보딩은 사용자가 익숙해지면 `다시 보지 않기`로 끌 수 있어야 하며, 편집을 막는 장벽이 되지 않게 한다.
- 온보딩은 항상 모바일 화면 기준으로 먼저 설계하고, 실제 조작 타깃 가까이에 붙는 작은 코치마크 형태로 유지한다.
- 온보딩 카드는 하단 CTA, 단계 탭, 핵심 미리보기 구역을 넓게 덮으면 안 된다.
- 재생 중 `freeze` 연출은 클립 플레이어와 공유 플레이어 모두 같은 기준(1초)으로 맞춘다.
- 하이라이트는 평상시 계속 남기지 않고, freeze 동안만 강하게 보여준 뒤 재생 복귀와 함께 풀리게 한다.
- 하이라이트 표현은 내부적으로 `soft ring`, `double ring`, `bracket light` 3계열을 지원하되 기본값은 EA-lite `bracket light`로 유지한다.
- freeze 동안에는 머리 위 `EA식 삼각 화살표 + 선수 이름`을 기본으로 노출하고, freeze 종료와 함께 함께 숨긴다.
- 공유/프로필 재생에서 세로 영상일 때 하단 선수 정보는 영상 위 오버레이가 아니라 compact docked bar로 처리한다.
- 편집 미리보기 시작 구간에서는 `showProfileCard`가 켜져 있으면 인트로 카드를 실제로 미리 보여준다.
- 위 변경으로 생긴 확대 미리보기, 프로필 카드 시작 연출, 하단 선수 정보 회귀는 현재 배치 안에서 즉시 복구한다.
- 세로 플레이어의 프로필 카드는 16:9 비율을 유지한 채 가운데에 맞춰 보여주고, 실제 재생 플레이어의 하이라이트는 freeze 종료와 동시에 즉시 사라지게 유지한다.
- `testplayer@footory.kr` 실계정 기준으로 프로필 카드 소비, freeze hold, 화면 비율별 하단 선수 정보 잘림을 브라우저에서 직접 재현해 확인한다.
- 기존 `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.focusZoom` 저장 계약은 유지하되, 사용자가 이 계약 구조를 직접 의식하지 않게 UX를 재구성한다.
- 실제 재생에서는 편집에서 정한 구도를 그대로 보여주는 쪽을 우선하고, 사용자가 확대된 영상을 좌우로 밀어 다시 구도를 맞추는 흐름은 기본 경험에서 제거한다.
- `testplayer@footory.kr` 계정 기준으로 세로/가로 비율 영상 각각에서 업로드→편집→저장→프로필 재생→공유 재생까지 막힘 없이 동작하도록 회귀를 우선 복구한다.

### 병행 배치 목표 (ops-console)

- `ops-console` 현황 패널에서 `Vercel`, `Cloudflare R2`, `Supabase` 사용량을 읽기 전용으로 조회한다.
- 토큰/계정 식별자는 로컬 환경 변수에서만 읽고, UI/로그/상태 파일에 비밀값을 저장하지 않는다.
- 조회 실패 시 서비스별 원인(키 누락, API 실패, 데이터 없음)을 짧게 노출하고 편집/쓰기 동작은 추가하지 않는다.
- 개발도 하는 관리자 기준으로 `현황` 첫 화면이 사용량, 배포 상태, 검증 상태를 우선 노출하도록 정리한다.
- 관리자 운영실을 처음 여는 사람도 `현황 → 업무 → 담당자 → 문서 → 검증` 순서를 3초 안에 이해할 수 있게 화면 안 가이드를 추가한다.
- `업무`, `담당자`, `문서`, `검증` 항목은 각각 무엇을 적는지 설명하고, 설명은 기본 화면을 가리지 않는 보조 UI로 제공한다.
- `긴급 경보`는 숫자 요약이 아니라 클릭 가능한 작업 목록으로 보여주고, 각 항목에서 관련 문서 편집 화면이나 업무 초안으로 바로 이동할 수 있게 한다.
- `긴급 경보`의 `Blocker/Release/Validation` 라벨은 "무슨 뜻인지", `문서 바로 열기`는 "열고 나서 무엇을 고치고 확인해야 하는지"를 카드 안에서 바로 이해되게 만든다.
- 문서 기반 경보는 문서 상단의 과거 이력 bullet이 아니라 현재 섹션 기준으로 읽어, 이미 해결된 blocker가 긴급 경보로 다시 뜨지 않게 한다.

### 병행 배치 목표 (automation)

- Footory 루트에 역할 경계가 선명한 agent 5개와 선택 agent 2개의 실제 프롬프트/운영 자산을 둔다.
- 반복 절차용 skill 3개를 로컬 plugin에 포함해, 나중에 Codex UI나 로컬 관리 흐름에서 같은 기준으로 재사용할 수 있게 한다.
- `ops-console`에서는 하드코딩된 담당자 설명만 보여주지 말고, 루트 저장소의 실제 agent/skill/plugin 자산을 읽어 목록, 목적, 금지선, 예시 요청, 경로를 보여준다.
- 관리자는 `Footory` 루트와 `ops-console` 어느 위치에서 작업하더라도 같은 자동화 자산 목록과 같은 사용 진입 문구를 확인할 수 있어야 한다.
- 로컬 자동화 기능은 외부 인증, 원격 동기화, 서버 전송 없이 저장소 안의 파일과 로컬 명령만 기준으로 유지한다.

## 실행 순서

### 1. 사용자 여정 기준 재구성

- 첫 사용자는 `영상 고르기 → 업로드 → 주인공 지정 → 저장`만 이해해도 끝낼 수 있어야 한다.
- 업로드 전 `구간 자르기`를 유지할지, 업로드 후 편집으로 완전히 옮길지 실제 사용자 입장에서 다시 비교하고 한 경로로 고정한다.
- 저장 직전에는 새 결정을 추가하지 않고, 이미 정한 결과를 확인하고 저장만 하게 한다.

### 2. 주인공/확대 단계 단순화

- `주인공` 단계의 첫 행동은 항상 `선수 한 번 누르기` 하나로 보이게 유지한다.
- 선수 탭 시 spotlight 좌표, 기본 zoom, 필요 시 freeze 시점을 draft에 반영한다.
- 확대 조정은 탭 이후 보조 선택으로 남기고, 탭 전에는 필수처럼 보이지 않게 한다.
- 사용자는 `주인공 지정 후 확대된 상태로 재생`을 바로 확인할 수 있어야 한다.
- 확대 조정 수단은 핀치와 `- / +` 버튼을 동시에 제공하되, 한 손 조작만으로도 완료 가능해야 한다.
- 확대 UX는 `고정 확대`까지만 허용하고, 사용자가 여러 점을 찍어 따라가게 하거나 재생 도중 구도를 다시 이동시키는 흐름은 넣지 않는다.

### 3. 재생 표현 정렬

- single-clip 편집 미리보기, 프로필 클립 플레이어, 공유 플레이어의 freeze hold 시간을 같은 상수(1초)로 맞춘다.
- single-clip 편집 미리보기는 저장 후 실제 프로필/공유 재생과 같은 확대 구도를 최대한 비슷하게 보여준다.
- 편집 미리보기에서 확대 조정이 가능해도, 저장 후 일반 재생에서는 수동 패닝 없이 고정 구도로 본다는 기준을 유지한다.
- freeze 시에는 EA-lite 브래킷 라이트와 머리 위 이름 화살표를 기본으로 쓰고, freeze가 끝나면 함께 제거한다.
- 평상시 재생 중에는 하이라이트를 남기지 않아 영상 자체가 주인공처럼 보이게 유지한다.
- 세로 영상의 lower third는 compact 레이아웃으로 줄이고, 공유 플레이어에서는 영상 바깥 아래로 분리한다.

### 4. 가이드와 상태 표현 재작성

- `정해짐`, `아직 없음` 같은 상태 중심 라벨보다 `주인공을 골랐어요`, `여기서 잠깐 멈출게요`처럼 행동/결과 중심 문구를 우선한다.
- 확대 프리셋은 쉬운 한국어 라벨로 바꾸고, 사용자에게 배율 숫자는 보조 정보로만 남긴다.
- 가이드는 설명문 나열이 아니라 화면 하이라이트 방식으로 바꾸고, `다음`, `건너뛰기`, `다시 보지 않기`만 제공한다.
- 온보딩은 편집 단계 전체 흐름, 주인공 지정, 확대 재생 확인 정도만 짧게 안내하고 저장 단계까지 끌고 가지 않는다.
- 온보딩 타깃은 실제 터치 영역 단위로 좁게 잡고, 모바일에서 카드가 CTA를 덮지 않는지 스크린샷으로 먼저 확인한다.

### 5. 검증 및 회귀

- 편집 플로우 E2E는 `선수 탭 → 자동 지정 → 확대 조정 → 저장 → 재진입 복구` 기준으로 유지/보강한다.
- 사용자 관점 검토 항목은 `처음 쓰는 사람이 1분 안에 저장 가능`, `모바일에서 핵심 흐름 막힘 없음`, `저장 직전 이탈 없이 완료 가능`으로 고정한다.
- 필수 검증: `npm run lint`, `npm run typecheck`, `npm run test:run`, 관련 Playwright upload/video 흐름.
- 사용자 앱 검증은 모바일 뷰포트를 기본으로 두고, 데스크톱은 보조 확인으로만 남긴다.
- 온보딩/코치마크 변경은 모바일 실제 화면 스크린샷 또는 모바일 Playwright 캡처 근거를 남긴다.
- 사용자 문구는 한국어 기준으로 다시 검토하고, 모바일 화면에서 행동 우선순위가 즉시 읽히는지 함께 점검한다.

### 5. 운영실 온보딩 정리 (ops-console)

- 헤더에서 바로 여는 `운영실 시작 가이드`를 추가해 콘솔 목적, 추천 순서, 담당자 라우팅 기준을 먼저 보여준다.
- `현황` 패널에 첫 사용자를 위한 시작 순서 카드를 두고, 각 패널별 가이드는 우측 보조 영역과 모바일 드로어에서 동일하게 보이게 유지한다.
- `업무`, `담당자`, `문서`, `검증` 항목은 "무엇을 쓰는지 / 언제 수정하는지 / 자주 하는 실수"까지 짧게 설명한다.
- `긴급 경보`는 source 문서와 액션을 함께 보여주고, `Blocker/Release/Validation` 경보는 문서 편집기로, `dirty 파일` 경보는 업무 초안으로 바로 연결한다.

### 6. 로컬 자동화 자산 정리

- agent는 역할 기반으로만 나누고, 기능 단위 세분화 agent는 만들지 않는다.
- 추천 core agent는 `core-video-editor`, `video-qa-runner`, `ux-copy-reviewer`, `playback-contract-guardian`, `repo-cleanup-refactorer`로 고정한다.
- 선택 agent는 `profile-publish-integrator`, `reel-highlight-composer`로 두되 기본 흐름에서는 보조 후보로만 노출한다.
- 반복 workflow는 agent가 아니라 skill로 두고, 이번 배치에서는 `playwright-smoke-check`, `manual-qa-report`, `docs-archive-classifier`만 등록한다.
- skill 배포 단위는 로컬 plugin 하나로 묶고, plugin manifest와 marketplace 파일은 실제 경로 기준으로 생성한다.
- `ops-console` 자동화 화면은 "무엇을 책임지는가(agent)", "어떤 절차를 반복하는가(skill)", "어디에 묶여 있는가(plugin)"가 바로 구분되게 만든다.

## 금지 사항

- 새 기능 추가 금지
- 제품 방향 변경 금지
- 소셜 피드화, 편집 앱화, 팀 중심 흐름 확장 금지
- 업로드와 편집에 같은 판단을 중복 배치한 상태를 유지한 채 문구만 고치는 식의 봉합 금지
- `ship-blockers.md`와 `release-readiness.md`가 이미 가진 상세 이력을 이 문서에 다시 누적 금지
- `deletion-candidates.md` 근거 없이 고위험 영역 삭제 금지
- `upload-store`, `upload-service`, `/api/render/*`, `/edit/[clipId]`, single-clip playback contract 영역 대수술 금지
- tracking/follow mode를 이번 배치에서 새 UX로 확장하지 않는다
- 완료된 배치의 상세 검증 로그를 이 문서에 다시 붙여 넣기 금지
- `ops-console`에서 원격 배포/인증/멀티유저 동기화 전제 추가 금지
- 인프라 사용량 조회 결과를 `ops-state.json`에 영구 저장 금지
- 운영 가이드를 별도 제품 기능처럼 승격하거나 관리자 흐름을 과도하게 복잡하게 만들지 않는다
- `긴급 경보`를 읽기 전용 장식 카드로 남기지 않는다
- agent/skill/plugin 정보를 `ops-console` 전용 하드코딩만으로 추가하고 루트 저장소 자산과 분리하는 방식 금지
- subagent를 자동 생성하는 UI나 무분별한 agent 증식 구조 추가 금지
- skill을 단순 문서 목록으로만 두고 실제 재사용 경로 없이 끝내는 방식 금지

## 보류 영역

### 삭제/정리 보류

- `src/stores/upload-store.ts`
- `src/lib/upload-service.ts`
- `src/lib/single-clip-playback.ts`
- `src/app/api/clips/[id]/route.ts`
- share / reel / profile 재생 소비 경로

### 이유

- `docs/deletion-candidates.md` 기준 핵심 플로우와 결합이 큰 영역이다.
- 현재는 삭제나 구조 변경보다 검증 공백 정리와 계약 유지가 우선이다.

## 완료 조건

- 처음 쓰는 사용자 기준으로 `영상 고르기 → 업로드 → 주인공 지정 → 저장` 흐름이 1분 안에 이해 가능해야 한다.
- 업로드 단계와 편집 단계 사이에 같은 판단을 두 번 요구하지 않아야 한다.
- `주인공` 단계에서 선수 탭 한 번만으로 spotlight + 기본 확대가 즉시 적용돼야 한다.
- 사용자는 확대된 상태로 실제 재생 결과를 편집 단계에서 바로 확인할 수 있어야 한다.
- 저장 단계에는 결과 확인과 저장 위치 선택만 남고, `highlight` 같은 새 판단이 기본 플로우를 막지 않아야 한다.
- 가이드는 텍스트 설명 카드가 아니라 화면 하이라이트 온보딩으로 동작하고, `다시 보지 않기`를 제공해야 한다.
- 클립 플레이어와 공유 플레이어의 freeze hold가 1초 기준으로 맞아야 한다.
- freeze 동안 머리 위 EA식 삼각 화살표와 선수 이름이 보여야 하고, freeze 종료와 함께 하이라이트 전체가 사라져야 한다.
- 관련 E2E가 새 문구와 조작 흐름 기준으로 통과해야 한다.
- canonical 문서(`video-upload-editing-spec`, `video-ux-principles`)와 실제 동작이 일치해야 한다.
- `ops-console`의 `긴급 경보` 각 항목은 클릭 시 바로 관련 대상(문서 편집 또는 업무 작성)으로 이동해야 한다.
- `ops-console`에서 agent, skill, plugin 목록과 실제 로컬 파일 경로를 함께 볼 수 있어야 한다.
- 관리자는 각 agent/skill별로 "언제 쓰는지", "무엇을 하지 않는지", "복붙할 요청 예시"를 바로 확인하고 복사할 수 있어야 한다.
- Footory 루트에는 plugin manifest, marketplace, skill 폴더, agent 프롬프트 자산이 실제 파일로 존재해야 한다.

## 다음 액션

### 바로 다음

- 업로드 단계 `구간 자르기` 유지/제거안을 사용자 여정 기준으로 먼저 확정한다.
- 저장 단계의 `대표 장면만 짧게 다시 보여주기`를 기본 플로우에서 제거할지 먼저 결정한다.
- 편집 미리보기와 `주인공` 패널 문구를 새 UX 기준으로 정리한다.
- `주인공 지정 후 확대된 상태로 재생 확인`이 single-clip 편집에서도 자연스럽게 보이도록 미리보기 구조를 정리한다.
- 클립 플레이어와 공유 플레이어의 freeze hold 상수를 공통화한다.
- 하이라이트 오버레이 내부 스타일을 분리해 원형/더블링/브래킷 라이트를 같은 렌더 계층에서 관리한다.
- 관련 Playwright 시나리오의 포커스 패널 문구/조작 기준을 새 흐름에 맞게 갱신한다.
- `testplayer@footory.kr` 실계정 브라우저 재현 기준으로 `profileId` 누락 공유 재생, 세로 비율 HUD 잘림, `freeze_at <= trimStart` 클립의 체감상 freeze 미노출을 우선 복구한다.

### 코드 배치 전

- 업로드 단계에서 허용하는 입력과 저장 호출을 표로 고정한다.
- 프로필 편집 진입 경로(`/profile`, `/editor`) 문구를 업로드 UX와 충돌 없게 확정한다.
- 부모 업로드(`childId`) 케이스에서 "사용 여부 선택"이 어떻게 동작할지 케이스를 분리한다.

### cleanup 재개 전

- `docs/deletion-candidates.md`의 저위험 후보부터 다시 확인한다.
- import, route, test, metadata 소비 경로가 모두 0인지 재검증한다.

## 작업 시작 체크리스트

- 이번 작업이 현재 목표 3개 중 어디에 속하는지 분명한가
- 관련 canonical docs를 먼저 읽었는가
- plan 문서에 새 배치가 필요한가, 아니면 기존 배치의 상태 변경인가
- 완료 후 이 문서에 남길 내용과 `recovery-log.md`로 보낼 내용을 구분했는가
- 코드 수정이 있다면 필요한 검증 명령을 미리 정했는가

## 문서 유지 규칙

- 이 문서에는 `진행 중` 상태만 남긴다.
- 완료된 배치는 같은 날이어도 `docs/recovery-log.md`로 이동한다.
- 긴 근거표, 상세 검증 로그, 과거 설계 비교는 참조 문서에 남기고 여기서는 링크만 둔다.
- 새 작업을 열 때는 목표, blocker, 이번 배치, 금지 사항, 완료 조건, 다음 액션만 갱신한다.
