import { footoryAgents, type AgentMode, type AgentDepartment, type FootoryAgent } from "./ops";

export type TaskStatus = "queued" | "in_progress" | "review" | "blocked" | "done";
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type DocCategory = "core" | "video" | "ux" | "qa" | "ops";

export interface CompanyTask {
  id: string;
  title: string;
  agentId: string;
  status: TaskStatus;
  priority: TaskPriority;
  goal: string;
  paths: string[];
  docs: string[];
  constraints: string[];
  doneCriteria: string[];
  verification: string[];
  note: string;
  updatedAt: string;
}

export interface ManagedDocRecord {
  path: string;
  title: string;
  category: DocCategory;
  ownerAgentId: string;
  purpose: string;
  editable: boolean;
}

export interface CheckRun {
  id: string;
  script: "lint" | "typecheck" | "test:run";
  status: "idle" | "running" | "passed" | "failed";
  exitCode: number | null;
  summary: string;
  output: string;
  startedAt: string;
  finishedAt: string | null;
}

export interface ActivityLog {
  id: string;
  type: "task" | "agent" | "doc" | "check";
  title: string;
  detail: string;
  agentId: string | null;
  taskId: string | null;
  docPath: string | null;
  createdAt: string;
}

export interface GitFileStatus {
  status: string;
  path: string;
}

export interface CompanyOverview {
  metrics: {
    docs: number;
    pages: number;
    apiRoutes: number;
    components: number;
    tests: number;
    libraries: number;
    dirtyFiles: number;
  };
  git: {
    dirty: boolean;
    files: GitFileStatus[];
  };
  resources: Array<{ label: string; count: number; detail: string }>;
  focusDocs: Array<{ title: string; path: string; ownerAgentId: string; excerpt: string }>;
  alerts: string[];
  checks: CheckRun[];
  workspace: {
    consolePath: string;
    repoPath: string;
    stateFilePath: string;
    allowedHosts: string[];
  };
}

export interface EditableAgent extends FootoryAgent {
  department: AgentDepartment;
  mode: AgentMode;
}

export interface CompanyState {
  agents: EditableAgent[];
  tasks: CompanyTask[];
  docRegistry: ManagedDocRecord[];
  checks: CheckRun[];
  activity: ActivityLog[];
}

export const managedDocsSeed: ManagedDocRecord[] = [
  {
    path: "ops-console/AGENTS.md",
    title: "ops-console 작업 지침",
    category: "ops",
    ownerAgentId: "chief-of-staff",
    purpose: "로컬 관리자 콘솔 전용 작업 원칙과 UI 제약",
    editable: true,
  },
  {
    path: "AGENTS.md",
    title: "작업 지침",
    category: "ops",
    ownerAgentId: "chief-of-staff",
    purpose: "Footory 전용 작업 원칙과 완료 기준의 최상위 지침",
    editable: true,
  },
  {
    path: "docs/product-dna.md",
    title: "제품 DNA",
    category: "core",
    ownerAgentId: "product-guardian",
    purpose: "선수 포트폴리오 중심 제품 방향의 기준",
    editable: true,
  },
  {
    path: "docs/feature-scope.md",
    title: "기능 범위",
    category: "core",
    ownerAgentId: "product-guardian",
    purpose: "must have, optional editing, phase 2 경계 정의",
    editable: true,
  },
  {
    path: "docs/app-overview.md",
    title: "앱 개요",
    category: "core",
    ownerAgentId: "data-contract-watchdog",
    purpose: "현재 구현 기준 라우트와 호출 흐름 요약",
    editable: true,
  },
  {
    path: "docs/repo-recovery-plan.md",
    title: "저장소 복구 계획",
    category: "ops",
    ownerAgentId: "chief-of-staff",
    purpose: "큰 작업 전 범위와 순서를 먼저 잠그는 계획 문서",
    editable: true,
  },
  {
    path: "docs/video-product-decisions.md",
    title: "영상 제품 결정",
    category: "video",
    ownerAgentId: "video-flow-architect",
    purpose: "clip-first 영상 제품의 기준과 우선순위",
    editable: true,
  },
  {
    path: "docs/video-upload-editing-spec.md",
    title: "영상 업로드 편집 스펙",
    category: "video",
    ownerAgentId: "video-flow-architect",
    purpose: "업로드, 편집, 저장 단계의 계약과 UX 규칙",
    editable: true,
  },
  {
    path: "docs/media-pipeline.md",
    title: "미디어 파이프라인",
    category: "video",
    ownerAgentId: "data-contract-watchdog",
    purpose: "원본 업로드, 저장, 재생, 렌더 관련 파이프라인 설명",
    editable: true,
  },
  {
    path: "docs/video-ux-principles.md",
    title: "영상 UX 원칙",
    category: "ux",
    ownerAgentId: "ux-copy-director",
    purpose: "모바일 우선 영상 UX 원칙과 금지 사항",
    editable: true,
  },
  {
    path: "docs/video-edit-flow.md",
    title: "영상 편집 플로우",
    category: "ux",
    ownerAgentId: "ux-copy-director",
    purpose: "사용자 관점 편집 흐름과 화면 전환 기준",
    editable: true,
  },
  {
    path: "docs/video-copy-guidelines.md",
    title: "영상 카피 가이드",
    category: "ux",
    ownerAgentId: "ux-copy-director",
    purpose: "한국어 기준 문구와 용어 통일 규칙",
    editable: true,
  },
  {
    path: "docs/testing/video-highlight-acceptance.md",
    title: "영상 acceptance",
    category: "qa",
    ownerAgentId: "qa-release-auditor",
    purpose: "영상 기능 acceptance criteria 기준",
    editable: true,
  },
  {
    path: "docs/testing/playwright-scenarios.md",
    title: "Playwright 시나리오",
    category: "qa",
    ownerAgentId: "qa-release-auditor",
    purpose: "모바일 우선 회귀 시나리오 정의",
    editable: true,
  },
  {
    path: "docs/testing/video-validation-report.md",
    title: "영상 검증 리포트",
    category: "qa",
    ownerAgentId: "qa-release-auditor",
    purpose: "실행 결과와 실패 근거 기록",
    editable: true,
  },
  {
    path: "docs/release-readiness.md",
    title: "출시 준비도",
    category: "qa",
    ownerAgentId: "qa-release-auditor",
    purpose: "배포 가능 여부와 남은 리스크 판단",
    editable: true,
  },
  {
    path: "docs/ship-blockers.md",
    title: "출시 blocker",
    category: "qa",
    ownerAgentId: "qa-release-auditor",
    purpose: "현재 배포를 막는 blocker 정리",
    editable: true,
  },
  {
    path: "docs/agent-company.md",
    title: "에이전트 운영 문서",
    category: "ops",
    ownerAgentId: "chief-of-staff",
    purpose: "전문 agent 운영 구조와 업무 규율 설명",
    editable: true,
  },
] as const;

export const companyTaskSeed: CompanyTask[] = [
  {
    id: "task-upload-contract",
    title: "single clip 계약 정렬",
    agentId: "video-flow-architect",
    status: "in_progress",
    priority: "critical",
    goal: "/upload review/save 와 playback 소비 계약을 같은 canonical contract로 묶는다.",
    paths: [
      "src/app/upload/page.tsx",
      "src/components/upload/HighlightSuggestionReview.tsx",
      "src/components/player/ClipPlayerSheet.tsx",
    ],
    docs: [
      "docs/video-product-decisions.md",
      "docs/video-upload-editing-spec.md",
      "docs/media-pipeline.md",
    ],
    constraints: [
      "multi-clip highlight 확장 금지",
      "render/export를 core flow로 올리지 않는다",
    ],
    doneCriteria: [
      "저장 payload와 재생 소비 필드가 하나의 contract로 설명된다",
      "검토 화면과 저장 후 재생 결과의 mismatch가 줄어든다",
    ],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: "현재 upload 관련 실제 수정이 이어지고 있어 가장 우선순위가 높다.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-release-monitor",
    title: "shipping blocker 재평가",
    agentId: "qa-release-auditor",
    status: "review",
    priority: "high",
    goal: "현재 변경분 기준으로 blocker, validation, release readiness를 다시 묶는다.",
    paths: [
      "docs/ship-blockers.md",
      "docs/release-readiness.md",
      "docs/testing/video-validation-report.md",
    ],
    docs: [
      "docs/testing/video-highlight-acceptance.md",
      "docs/testing/playwright-scenarios.md",
    ],
    constraints: [
      "실행하지 않은 검증은 통과 처리하지 않는다",
      "문서와 구현이 다르면 구현을 기준으로 기록한다",
    ],
    doneCriteria: [
      "blocker와 non-blocker가 구분된다",
      "재현 경로와 검증 근거가 남는다",
    ],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: "현재 release 문서가 dirty 상태라 추적이 필요하다.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-company-console",
    title: "로컬 운영 콘솔 고도화",
    agentId: "chief-of-staff",
    status: "queued",
    priority: "normal",
    goal: "업무 지시, agent 범위, docs 편집, 모니터링을 모두 별도 ops-console에서 다룬다.",
    paths: [
      "ops-console/app/page.tsx",
      "ops-console/components/company/*",
      "ops-console/lib/company/*",
    ],
    docs: [
      "docs/agent-company.md",
      "docs/repo-recovery-plan.md",
    ],
    constraints: [
      "로컬 전용으로 제한",
      "Footory 제품 플로우와 혼동되지 않는 내부 툴이어야 한다",
    ],
    doneCriteria: [
      "브라우저 UI에서 task, agent, docs, checks를 관리할 수 있다",
      "git 상태와 주요 문서 상태를 한 화면에서 볼 수 있다",
    ],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: "현재 단계에서 구현 중인 항목이다.",
    updatedAt: new Date().toISOString(),
  },
];

export const companyActivitySeed: ActivityLog[] = [
  {
    id: "activity-seed-company-console",
    type: "task",
    title: "운영 콘솔 초기 업무 등록",
    detail: "로컬 운영 콘솔 고도화 업무가 seed 상태로 준비됐다.",
    agentId: "chief-of-staff",
    taskId: "task-company-console",
    docPath: "docs/agent-company.md",
    createdAt: new Date().toISOString(),
  },
  {
    id: "activity-seed-upload-contract",
    type: "task",
    title: "single clip 계약 정렬 추적 시작",
    detail: "업로드와 playback 계약 정렬 업무를 현재 진행 중 업무로 유지한다.",
    agentId: "video-flow-architect",
    taskId: "task-upload-contract",
    docPath: "docs/video-upload-editing-spec.md",
    createdAt: new Date().toISOString(),
  },
  {
    id: "activity-seed-release-monitor",
    type: "task",
    title: "release 문서 재평가 대기",
    detail: "blocker와 validation 문서 재평가 업무가 검토 상태로 등록됐다.",
    agentId: "qa-release-auditor",
    taskId: "task-release-monitor",
    docPath: "docs/release-readiness.md",
    createdAt: new Date().toISOString(),
  },
];

export const companyStateSeed: CompanyState = {
  agents: footoryAgents.map((agent) => ({ ...agent })),
  tasks: companyTaskSeed,
  docRegistry: managedDocsSeed.map((doc) => ({ ...doc })),
  checks: [],
  activity: companyActivitySeed,
};
