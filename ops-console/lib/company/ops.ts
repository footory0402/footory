export type AgentDepartment = "Command" | "Product" | "Build" | "QA";
export type AgentMode = "route" | "guard" | "design" | "build" | "audit";

export interface AgentBriefExample {
  label: string;
  goal: string;
  paths: string;
  done: string;
  verification: string;
}

export interface FootoryAgent {
  id: string;
  name: string;
  title: string;
  department: AgentDepartment;
  mode: AgentMode;
  summary: string;
  canDo: string[];
  wontDo: string[];
  recentWork: string[];
  nextMoves: string[];
  redFlags: string[];
  sourceDocs: string[];
  examples: AgentBriefExample[];
}

export interface BriefDraft {
  goal?: string;
  paths?: string;
  done?: string;
  verification?: string;
}

export const companyCharter = [
  {
    title: "선수 포트폴리오 우선",
    body: "모든 판단은 선수 어필, clip 근거, 기록 전달력 강화로 수렴해야 한다.",
    source: "docs/product-dna.md",
  },
  {
    title: "실제 코드 우선",
    body: "문서보다 실제 라우트와 호출 흐름을 먼저 보고, 차이는 따로 기록한다.",
    source: "AGENTS.md",
  },
  {
    title: "검증 없이는 완료 아님",
    body: "기본 검증은 lint, typecheck, test:run이며 사용자 플로우 변경은 추가 검증을 붙인다.",
    source: "AGENTS.md",
  },
] as const;

export const operatingRules = [
  "큰 작업은 docs/repo-recovery-plan.md를 먼저 갱신한다.",
  "제품 방향을 임의로 바꾸지 않는다.",
  "한 화면의 핵심 행동은 1~2개만 남긴다.",
  "영상은 clip-first, spotlight/zoom core playback을 지킨다.",
  "문서와 구현이 다르면 구현을 기준으로 기록한다.",
  "반복 절차는 skill로 빼고, 역할 책임은 agent로 분리한다.",
  "로컬 운영 허브는 내부 판단 정리용이며 외부 배포 콘솔로 확장하지 않는다.",
] as const;

export const verificationBaseline = [
  "npm run lint",
  "npm run typecheck",
  "npm run test:run",
] as const;

export const footoryAgents: FootoryAgent[] = [
  {
    id: "core-video-editor",
    name: "Core Video Editor",
    title: "single-clip 편집 구현",
    department: "Build",
    mode: "build",
    summary: "영상 업로드 이후 편집, 저장, 복구, overlay safe area 같은 코어 구현을 맡는다.",
    canDo: [
      "single-clip 편집 기능 구현",
      "업로드 후 편집 진입 플로우 유지",
      "trim, spotlight, zoom, lower third, player card 편집 UI 정리",
      "draft 저장과 복구 구현",
    ],
    wontDo: [
      "share, reel, profile playback contract 대수술",
      "검증 없는 대규모 리팩터링",
      "영어 사용자 문구 추가",
    ],
    recentWork: [
      "single-clip 편집 흐름 단순화 후보 정리",
      "spotlight와 zoom 편집 진입 UX 정리",
      "draft 저장과 복구 우선순위 유지",
    ],
    nextMoves: [
      "overlay safe area와 lower third 정리",
      "single-clip 저장과 재진입 복구 구현",
    ],
    redFlags: [
      "playback contract를 검증 없이 바꾸는 요청",
      "전문 편집기처럼 복잡한 멀티패널 구조",
      "영어 문구를 새로 추가하는 요청",
    ],
    sourceDocs: [
      "AGENTS.md",
      "docs/video-ux-principles.md",
      "docs/video-edit-flow.md",
      "docs/video-copy-guidelines.md",
      "docs/video-product-decisions.md",
      "docs/repo-recovery-plan.md",
      "docs/video-upload-editing-spec.md",
      "docs/media-pipeline.md",
    ],
    examples: [
      {
        label: "spotlight UX 단순화",
        goal: "single-clip 편집 화면에서 spotlight와 zoom UX만 단순화",
        paths: "src/app/upload/page.tsx, src/components/upload/*",
        done: "다른 저장 계약은 건드리지 않고 UX만 단순화",
        verification: "npm run lint, npm run typecheck, npm run test:run",
      },
    ],
  },
  {
    id: "video-qa-runner",
    name: "Video QA Runner",
    title: "Playwright와 검증 리포트",
    department: "QA",
    mode: "audit",
    summary: "업로드, 편집, 저장, 재진입, publish 흐름을 실제 사용자처럼 검증한다.",
    canDo: [
      "P0, P1 Playwright 시나리오 실행",
      "업로드, 편집, 저장, 재진입, publish 흐름 검증",
      "video-validation-report.md 갱신",
      "실패 플로우 재현과 재현 경로 정리",
    ],
    wontDo: [
      "제품 구조 직접 변경",
      "store나 API 계약 임의 수정",
      "새 기능 제안으로 범위 확장",
    ],
    recentWork: [
      "영상 acceptance와 Playwright smoke 기준 유지",
      "실패 플로우 재현 경로 기록",
      "validation report 업데이트 지점 정리",
    ],
    nextMoves: [
      "업로드에서 편집 진입 smoke 고정",
      "저장 후 재진입과 publish smoke 재확인",
    ],
    redFlags: [
      "실행하지 않은 테스트를 통과 처리하는 요청",
      "코드 수정까지 같이 맡기려는 요청",
      "재현 경로 없이 blocker만 기록하는 요청",
    ],
    sourceDocs: [
      "docs/testing/video-highlight-acceptance.md",
      "docs/testing/playwright-scenarios.md",
      "docs/testing/video-validation-report.md",
      "docs/release-readiness.md",
      "docs/ship-blockers.md",
    ],
    examples: [
      {
        label: "P0 smoke 검증",
        goal: "업로드→편집 진입, 편집→저장→재진입, 편집→publish→profile 3개 P0 시나리오만 검증",
        paths: "tests/e2e/video/*.spec.ts, docs/testing/*",
        done: "실행한 smoke 결과와 실패 재현 경로를 남긴다",
        verification: "npm run lint, npm run typecheck, npm run test:run",
      },
    ],
  },
  {
    id: "ux-copy-reviewer",
    name: "UX Copy Reviewer",
    title: "한국어 문구와 사용성 검토",
    department: "Product",
    mode: "design",
    summary: "한 화면 핵심 행동, 한국어 카피, overlay 가시성, 단순한 편집 흐름을 검토한다.",
    canDo: [
      "영어 문구를 쉬운 한국어로 교체 제안",
      "CTA 명확성 검토",
      "한 화면 행동 수와 흐름 복잡도 점검",
      "overlay와 lower third 가시성 점검",
    ],
    wontDo: [
      "저장이나 API 구조 수정",
      "상태관리 리팩터링",
      "새 기능 추가",
    ],
    recentWork: [
      "불필요한 영어 문구 제거 기준 유지",
      "한 화면 핵심 행동 1~2개 원칙 점검",
      "overlay safe area 점검 포인트 정리",
    ],
    nextMoves: [
      "편집 화면 CTA 밀도 재점검",
      "overlay와 lower third 가시성 재검토",
    ],
    redFlags: [
      "한 화면에 3개 이상 핵심 행동 배치",
      "영어와 내부 용어를 그대로 노출하는 요청",
      "overlay가 safe area를 침범하는 구조",
    ],
    sourceDocs: [
      "docs/video-ux-principles.md",
      "docs/video-edit-flow.md",
      "docs/video-copy-guidelines.md",
    ],
    examples: [
      {
        label: "편집 화면 문구 검토",
        goal: "업로드 후 편집 화면을 보고 무엇을 해야 하는지 모호한 지점과 영어 문구를 모두 찾아 한국어로 제안",
        paths: "src/app/upload/page.tsx, src/components/upload/*",
        done: "한국어 문구와 CTA 제안을 행동 기준으로 정리",
        verification: "safe area와 UX 원칙을 같이 점검",
      },
    ],
  },
  {
    id: "playback-contract-guardian",
    name: "Playback Contract Guardian",
    title: "single-clip contract 보호",
    department: "Build",
    mode: "audit",
    summary: "upload, editor, share, reel, profile에서 single-clip playback 필드 일관성을 감시한다.",
    canDo: [
      "trim_start, trim_end, highlight_start, highlight_end 소비 경로 점검",
      "spotlight_x, spotlight_y, freeze_at 소비 경로 점검",
      "effects.trackingMode, effects.trackingPoints 일관성 확인",
      "overlay와 profile metadata 계약 검토",
    ],
    wontDo: [
      "UI polish 작업",
      "copy 수정",
      "unrelated cleanup",
    ],
    recentWork: [
      "single-clip playback contract 위험 필드 정리",
      "share, reel, profile 재생 경로 비교",
      "editor 저장 필드 소비 지점 추적",
    ],
    nextMoves: [
      "저장과 재생 소비 경로 불일치 후보 재확인",
      "복원 로직과 공개 재생 경로 영향 점검",
    ],
    redFlags: [
      "저장 필드 소비 확인 없이 계약 변경",
      "검증 없이 share, profile 재생 경로 수정",
      "UI 범위와 계약 검토 범위를 섞는 요청",
    ],
    sourceDocs: [
      "docs/video-product-decisions.md",
      "docs/video-upload-editing-spec.md",
      "docs/media-pipeline.md",
      "docs/implementation-gap.md",
      "docs/legacy-video-architecture-review.md",
    ],
    examples: [
      {
        label: "contract 검토 전용",
        goal: "이번 변경이 clip playback contract를 깨는지 검토만 수행",
        paths: "src/app/upload/page.tsx, src/lib/*, src/components/player/*",
        done: "깨질 수 있는 필드와 소비 경로를 실제 코드 기준으로 설명",
        verification: "코드 수정 없이 저장 경로와 재생 경로를 함께 추적",
      },
    ],
  },
  {
    id: "repo-cleanup-refactorer",
    name: "Repo Cleanup Refactorer",
    title: "안전한 정리 작업",
    department: "Build",
    mode: "audit",
    summary: "영상 핵심 계약을 건드리지 않는 범위의 dead code, 중복 UI, 문서 archive 정리를 맡는다.",
    canDo: [
      "안 쓰는 파일 삭제 후보 정리",
      "snapshot과 임시 md 정리",
      "단순 중복 UI 통합",
      "archive 계획에 따른 문서 분류 반영",
    ],
    wontDo: [
      "upload-store 수정",
      "upload-service 수정",
      "/api/clips/[id] 수정",
      "share, reel, profile playback contract 수정",
      "저장과 복구 로직 수정",
    ],
    recentWork: [
      "dead code 후보와 실사용 경로 구분",
      "archive 계획 반영 준비",
      "저위험 정리 대상 분류",
    ],
    nextMoves: [
      "문서 archive 후보와 keep 후보 분리",
      "단순 중복 UI 통합 후보 점검",
    ],
    redFlags: [
      "핵심 계약 영역을 cleanup 명분으로 수정하는 요청",
      "호출 근거 없이 파일 삭제하는 요청",
      "한 번에 넓은 범위를 지우는 요청",
    ],
    sourceDocs: [
      "docs/deletion-candidates.md",
      "docs/docs-classification.md",
      "docs/archive-plan.md",
      "docs/repo-recovery-plan.md",
    ],
    examples: [
      {
        label: "안전한 dead code 정리",
        goal: "영상 핵심 플로우를 건드리지 않는 범위에서 dead code와 중복 UI만 정리",
        paths: "src/components/*, docs/*",
        done: "삭제 후보, 보류, keep 근거를 분리",
        verification: "import, route, test 근거를 함께 남긴다",
      },
    ],
  },
  {
    id: "profile-publish-integrator",
    name: "Profile Publish Integrator",
    title: "publish와 프로필 연결",
    department: "Build",
    mode: "build",
    summary: "single clip이나 reel 결과물을 프로필 자산과 featured 연결까지 이어 주는 선택 agent다.",
    canDo: [
      "single clip publish 연결",
      "featured 연결 점검",
      "tag portfolio 연결 점검",
      "player info overlay와 실제 프로필 정보 정합성 검토",
    ],
    wontDo: [
      "저장과 복구가 불안정한 상태에서 publish 흐름 확장",
      "피드형 공유 기능 확장",
      "팀 중심 구조 개편",
    ],
    recentWork: [
      "featured 연결 지점 재확인",
      "프로필 반영 경로 정리",
      "player info overlay 정합성 후보 추적",
    ],
    nextMoves: [
      "저장 안정화 이후 publish 연결 복구",
      "featured와 tag portfolio 반영 누락 점검",
    ],
    redFlags: [
      "save와 restore가 불안정한 상태에서 publish부터 고도화하는 요청",
      "팀 중심 구조로 프로필 동선을 바꾸는 요청",
      "피드형 공유 기능을 붙이는 요청",
    ],
    sourceDocs: [
      "AGENTS.md",
      "docs/product-dna.md",
      "docs/feature-scope.md",
      "docs/video-product-decisions.md",
      "AGENTS.md",
      "docs/app-overview.md",
    ],
    examples: [
      {
        label: "featured 연결 점검",
        goal: "저장이 끝난 single clip이 프로필 featured까지 자연스럽게 연결되는지 검토",
        paths: "src/app/p/[handle]/page.tsx, src/components/profile/*, src/app/api/featured/route.ts",
        done: "연결 누락과 정합성 문제를 정리",
        verification: "프로필 반영 경로와 실제 데이터 소비를 함께 확인",
      },
    ],
  },
  {
    id: "reel-highlight-composer",
    name: "Reel Highlight Composer",
    title: "multi-clip reel 상위 흐름",
    department: "Build",
    mode: "design",
    summary: "single-clip 저장과 publish가 안정된 뒤 여러 clip을 묶는 reel highlight 상위 흐름을 맡는다.",
    canDo: [
      "clip 선택과 순서 변경",
      "preview 구성",
      "draft 저장",
      "featured 연결 후보화",
    ],
    wontDo: [
      "single-clip 안정화 전에 reel을 core flow로 승격",
      "과한 편집 앱형 UI 추가",
      "export 중심 구조 선행",
    ],
    recentWork: [
      "multi-clip 상위 구조를 phase 2로 유지",
      "reel draft 저장 후보 구조 정리",
      "single-clip 중심 우선순위 고정",
    ],
    nextMoves: [
      "single-clip 저장과 publish 안정화 뒤 진입",
      "clip 선택과 순서 변경 최소 구조 제안",
    ],
    redFlags: [
      "single-clip flow보다 reel을 먼저 고도화하는 요청",
      "복잡한 편집 앱형 멀티패널 구조",
      "export와 render를 core flow로 끌어올리는 요청",
    ],
    sourceDocs: [
      "AGENTS.md",
      "docs/feature-scope.md",
      "docs/video-product-decisions.md",
      "docs/video-upload-editing-spec.md",
      "docs/media-pipeline.md",
    ],
    examples: [
      {
        label: "reel draft 최소 구조",
        goal: "multi-clip reel draft 저장 구조 초안만 검토",
        paths: "src/components/*, src/lib/*",
        done: "single-clip flow를 건드리지 않는 범위의 최소 구조만 제안",
        verification: "현재 single-clip contract와 충돌하지 않음을 설명",
      },
    ],
  },
];

export function getAgent(agentId: string): FootoryAgent {
  return footoryAgents.find((agent) => agent.id === agentId) ?? footoryAgents[0];
}

export function buildAgentBrief(agent: FootoryAgent, draft: BriefDraft = {}): string {
  const goal = draft.goal?.trim() || "여기에 맡길 업무를 한 문장으로 적기";
  const paths = draft.paths?.trim() || "관련 경로/파일을 적기";
  const done = draft.done?.trim() || "완료 기준을 구체적으로 적기";
  const verification = draft.verification?.trim() || verificationBaseline.join(", ");

  return [
    `@${agent.id}`,
    `목표: ${goal}`,
    `관련 경로/파일: ${paths}`,
    `근거 문서: ${agent.sourceDocs.join(", ")}`,
    `제약: ${agent.redFlags[0]}`,
    `완료 기준: ${done}`,
    `검증: ${verification}`,
  ].join("\n");
}
