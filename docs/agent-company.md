# Footory agent, skill, plugin 운영 문서

## 목적
- Footory에서는 에이전트를 많이 두는 것보다 역할 경계가 선명한 소수 에이전트를 유지한다.
- agent는 "누가 무엇을 책임지는가", skill은 "반복 절차를 어떻게 실행하는가", plugin은 "그 skill을 어떤 단위로 묶는가"를 뜻한다.
- 모든 자동화 자산은 Footory가 유소년 축구 선수 포트폴리오 제품이라는 전제를 바꾸지 않는다.

## 핵심 운영 원칙
- 실제 코드, 실제 라우트, 실제 호출 흐름을 먼저 본다.
- 설계 문서와 구현이 다르면 구현을 기준으로 판단하고 문서 불일치는 따로 기록한다.
- 큰 작업은 먼저 `docs/repo-recovery-plan.md`를 갱신한다.
- 코드 수정 뒤에는 `npm run lint`, `npm run typecheck`, `npm run test:run`을 기본으로 실행한다.
- 역할이 겹치는 agent를 늘리지 말고, 반복되는 절차는 skill로 뺀다.

## 실제 자산 위치
- agent registry: `.agents/footory-automation.json`
- agent prompt files: `.agents/agents/*.md`
- local marketplace: `.agents/plugins/marketplace.json`
- local plugin manifest: `plugins/footory-ops-toolkit/.codex-plugin/plugin.json`
- bundled skills: `plugins/footory-ops-toolkit/skills/*`
- quick commands:
  - `npm run ops:automation:list`
  - `npm run ops:agent -- <agent-id>`
  - `npm run ops:skill -- <skill-id>`
  - `npm run ops:plugin -- footory-ops-toolkit`

## 권장 agent 5개

### 1. `core-video-editor`
- 역할: single-clip 편집, 저장, 복구, overlay safe area 구현
- 먼저 읽기:
  - `AGENTS.md`
  - `docs/video-ux-principles.md`
  - `docs/video-edit-flow.md`
  - `docs/video-copy-guidelines.md`
  - `docs/video-product-decisions.md`
  - `docs/video-upload-editing-spec.md`
  - `docs/media-pipeline.md`
- 맡지 않는 일:
  - share, reel, profile playback contract 대수술
  - 검증 없는 대규모 리팩터링
  - 영어 문구 추가

### 2. `video-qa-runner`
- 역할: Playwright, smoke, validation report, 재현 경로 정리
- 먼저 읽기:
  - `docs/testing/video-highlight-acceptance.md`
  - `docs/testing/playwright-scenarios.md`
  - `docs/testing/video-validation-report.md`
  - `docs/release-readiness.md`
  - `docs/ship-blockers.md`
- 맡지 않는 일:
  - 제품 구조 직접 변경
  - store나 API 계약 임의 수정
  - 범위 확장 제안

### 3. `ux-copy-reviewer`
- 역할: 한국어 문구, CTA, overlay 가시성, 단순한 편집 흐름 검토
- 먼저 읽기:
  - `docs/video-ux-principles.md`
  - `docs/video-edit-flow.md`
  - `docs/video-copy-guidelines.md`
- 맡지 않는 일:
  - 저장이나 API 구조 수정
  - 상태관리 리팩터링
  - 새 기능 추가

### 4. `playback-contract-guardian`
- 역할: single-clip playback contract 보호
- 먼저 읽기:
  - `docs/video-product-decisions.md`
  - `docs/video-upload-editing-spec.md`
  - `docs/media-pipeline.md`
  - `docs/implementation-gap.md`
  - `docs/legacy-video-architecture-review.md`
- 맡지 않는 일:
  - UI polish
  - copy 수정
  - unrelated cleanup

### 5. `repo-cleanup-refactorer`
- 역할: 안전한 dead code, 중복 UI, 문서 archive 정리
- 먼저 읽기:
  - `docs/deletion-candidates.md`
  - `docs/docs-classification.md`
  - `docs/archive-plan.md`
  - `docs/repo-recovery-plan.md`
- 맡지 않는 일:
  - `upload-store`
  - `upload-service`
  - `/api/clips/[id]`
  - share, reel, profile playback contract
  - 저장과 복구 로직

## 선택 agent 2개

### 6. `profile-publish-integrator`
- 역할: single clip 또는 reel 결과물을 프로필과 featured에 연결
- 사용 시점: 저장과 복구가 안정된 뒤

### 7. `reel-highlight-composer`
- 역할: 여러 clip을 묶는 reel highlight 상위 기능
- 사용 시점: single-clip 저장과 publish 흐름이 안정된 뒤

## skill로 두는 반복 workflow 3개
- `playwright-smoke-check`
  - smoke Playwright 실행, 실패 메모, validation report 반영
- `manual-qa-report`
  - 수동 QA 체크, UX 문제 정리, 문서 업데이트 포인트 작성
- `docs-archive-classifier`
  - 문서 분류, archive 후보 정리, safe cleanup 제안

## 지시 프로토콜

모든 agent 요청은 아래 틀을 기본값으로 쓴다.

```text
@agent-name
목표:
관련 경로/파일:
근거 문서:
제약:
완료 기준:
검증:
```

skill은 아래처럼 호출한다.

```text
Use $skill-name to ...
```

## 로컬 운영 허브
- 디렉토리: `ops-console/`
- 주소: `http://localhost:3301`
- 목적: agent, skill, plugin, 업무, 문서, 검증을 한 화면에서 이어서 관리한다.
- 접근 원칙: Footory 사용자 웹앱과 분리된 로컬 개발 서버로만 쓴다.
- 운영 범위:
  - task board 기반 업무 작성과 배정
  - agent, skill, plugin 목록과 프롬프트 확인
  - canonical docs 편집
  - git dirty 상태와 기본 검증 모니터링
