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

export interface CompanyAlert {
  id: string;
  kind: "dirty" | "blocker" | "release" | "validation";
  label: string;
  summary: string;
  sourcePath: string | null;
  sourceLabel: string;
  actionLabel: string;
  meaning: string;
  nextStep: string;
  detailLines: string[];
  editable: boolean;
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
  infraUsage: {
    fetchedAt: string;
    services: Array<{
      id: "vercel" | "r2" | "supabase";
      label: string;
      status: "ok" | "partial" | "missing" | "error";
      summary: string;
      metrics: Array<{ label: string; value: string }>;
      notes: string[];
    }>;
  };
  focusDocs: Array<{ title: string; path: string; ownerAgentId: string; excerpt: string }>;
  alerts: CompanyAlert[];
  checks: CheckRun[];
  workspace: {
    consolePath: string;
    repoPath: string;
    stateFilePath: string;
    allowedHosts: string[];
  };
  automation: {
    updatedAt: string | null;
    agentCount: number;
    skillCount: number;
    pluginCount: number;
    registryPath: string;
    marketplacePath: string;
    pluginRoot: string;
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
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "로컬 관리자 콘솔 전용 작업 원칙과 UI 제약",
    editable: true,
  },
  {
    path: "AGENTS.md",
    title: "작업 지침",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "Footory 전용 작업 원칙과 완료 기준의 최상위 지침",
    editable: true,
  },
  {
    path: "docs/product-dna.md",
    title: "제품 DNA",
    category: "core",
    ownerAgentId: "core-video-editor",
    purpose: "선수 포트폴리오 중심 제품 방향의 기준",
    editable: true,
  },
  {
    path: "docs/feature-scope.md",
    title: "기능 범위",
    category: "core",
    ownerAgentId: "core-video-editor",
    purpose: "must have, optional editing, phase 2 경계 정의",
    editable: true,
  },
  {
    path: "docs/app-overview.md",
    title: "앱 개요",
    category: "core",
    ownerAgentId: "playback-contract-guardian",
    purpose: "현재 구현 기준 라우트와 호출 흐름 요약",
    editable: true,
  },
  {
    path: "docs/repo-recovery-plan.md",
    title: "저장소 복구 계획",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "큰 작업 전 범위와 순서를 먼저 잠그는 계획 문서",
    editable: true,
  },
  {
    path: "docs/video-product-decisions.md",
    title: "영상 제품 결정",
    category: "video",
    ownerAgentId: "playback-contract-guardian",
    purpose: "clip-first 영상 제품의 기준과 우선순위",
    editable: true,
  },
  {
    path: "docs/video-upload-editing-spec.md",
    title: "영상 업로드 편집 스펙",
    category: "video",
    ownerAgentId: "core-video-editor",
    purpose: "업로드, 편집, 저장 단계의 계약과 UX 규칙",
    editable: true,
  },
  {
    path: "docs/media-pipeline.md",
    title: "미디어 파이프라인",
    category: "video",
    ownerAgentId: "playback-contract-guardian",
    purpose: "원본 업로드, 저장, 재생, 렌더 관련 파이프라인 설명",
    editable: true,
  },
  {
    path: "docs/video-ux-principles.md",
    title: "영상 UX 원칙",
    category: "ux",
    ownerAgentId: "ux-copy-reviewer",
    purpose: "모바일 우선 영상 UX 원칙과 금지 사항",
    editable: true,
  },
  {
    path: "docs/video-edit-flow.md",
    title: "영상 편집 플로우",
    category: "ux",
    ownerAgentId: "ux-copy-reviewer",
    purpose: "사용자 관점 편집 흐름과 화면 전환 기준",
    editable: true,
  },
  {
    path: "docs/video-copy-guidelines.md",
    title: "영상 카피 가이드",
    category: "ux",
    ownerAgentId: "ux-copy-reviewer",
    purpose: "한국어 기준 문구와 용어 통일 규칙",
    editable: true,
  },
  {
    path: "docs/testing/video-highlight-acceptance.md",
    title: "영상 acceptance",
    category: "qa",
    ownerAgentId: "video-qa-runner",
    purpose: "영상 기능 acceptance criteria 기준",
    editable: true,
  },
  {
    path: "docs/testing/playwright-scenarios.md",
    title: "Playwright 시나리오",
    category: "qa",
    ownerAgentId: "video-qa-runner",
    purpose: "모바일 우선 회귀 시나리오 정의",
    editable: true,
  },
  {
    path: "docs/testing/video-validation-report.md",
    title: "영상 검증 리포트",
    category: "qa",
    ownerAgentId: "video-qa-runner",
    purpose: "실행 결과와 실패 근거 기록",
    editable: true,
  },
  {
    path: "docs/implementation-gap.md",
    title: "구현 간극 분석",
    category: "video",
    ownerAgentId: "playback-contract-guardian",
    purpose: "문서와 실제 구현 사이 계약 차이 분석",
    editable: true,
  },
  {
    path: "docs/legacy-video-architecture-review.md",
    title: "레거시 영상 구조 리뷰",
    category: "video",
    ownerAgentId: "playback-contract-guardian",
    purpose: "레거시 영상 구조와 현재 계약의 차이 참고",
    editable: true,
  },
  {
    path: "docs/deletion-candidates.md",
    title: "삭제 후보",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "저위험 삭제 후보와 보류 근거 정리",
    editable: true,
  },
  {
    path: "docs/docs-classification.md",
    title: "문서 분류 기준",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "current, canonical, reference, archive 문서 분류 기준",
    editable: true,
  },
  {
    path: "docs/archive-plan.md",
    title: "문서 archive 계획",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "문서 archive 순서와 이동 기준",
    editable: true,
  },
  {
    path: "docs/release-readiness.md",
    title: "출시 준비도",
    category: "qa",
    ownerAgentId: "video-qa-runner",
    purpose: "배포 가능 여부와 남은 리스크 판단",
    editable: true,
  },
  {
    path: "docs/ship-blockers.md",
    title: "출시 blocker",
    category: "qa",
    ownerAgentId: "video-qa-runner",
    purpose: "현재 배포를 막는 blocker 정리",
    editable: true,
  },
  {
    path: "docs/agent-company.md",
    title: "agent, skill, plugin 운영 문서",
    category: "ops",
    ownerAgentId: "repo-cleanup-refactorer",
    purpose: "Footory 자동화 자산 구조와 사용 규율 설명",
    editable: true,
  },
] as const;

export const companyTaskSeed: CompanyTask[] = [
  {
    id: "task-upload-contract",
    title: "single clip 계약 정렬",
    agentId: "playback-contract-guardian",
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
    agentId: "video-qa-runner",
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
    title: "로컬 자동화 콘솔 연결",
    agentId: "repo-cleanup-refactorer",
    status: "queued",
    priority: "normal",
    goal: "루트 agent, skill, plugin 자산을 ops-console에서 한 화면으로 관리하고 사용 진입점을 붙인다.",
    paths: [
      "ops-console/app/page.tsx",
      "ops-console/components/company/*",
      "ops-console/lib/company/*",
      ".agents/footory-automation.json",
      "plugins/footory-ops-toolkit/*",
    ],
    docs: [
      "docs/agent-company.md",
      "docs/repo-recovery-plan.md",
    ],
    constraints: [
      "로컬 전용으로 제한",
      "Footory 제품 플로우와 혼동되지 않는 내부 툴이어야 한다",
      "하드코딩만으로 agent, skill, plugin을 관리하지 않는다",
    ],
    doneCriteria: [
      "브라우저 UI에서 agent, skill, plugin 목록과 실제 파일 경로를 볼 수 있다",
      "root와 ops-console 어느 위치에서든 같은 사용 명령을 확인할 수 있다",
    ],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: "이번 배치에서 루트 자동화 자산과 콘솔 UI를 함께 정리한다.",
    updatedAt: new Date().toISOString(),
  },
];

export const companyActivitySeed: ActivityLog[] = [
  {
    id: "activity-seed-company-console",
    type: "task",
    title: "자동화 콘솔 연결 업무 등록",
    detail: "루트 agent, skill, plugin 자산을 콘솔에서 관리하는 업무가 seed 상태로 준비됐다.",
    agentId: "repo-cleanup-refactorer",
    taskId: "task-company-console",
    docPath: "docs/agent-company.md",
    createdAt: new Date().toISOString(),
  },
  {
    id: "activity-seed-upload-contract",
    type: "task",
    title: "single clip 계약 정렬 추적 시작",
    detail: "업로드와 playback 계약 정렬 업무를 현재 진행 중 업무로 유지한다.",
    agentId: "playback-contract-guardian",
    taskId: "task-upload-contract",
    docPath: "docs/video-upload-editing-spec.md",
    createdAt: new Date().toISOString(),
  },
  {
    id: "activity-seed-release-monitor",
    type: "task",
    title: "release 문서 재평가 대기",
    detail: "blocker와 validation 문서 재평가 업무가 검토 상태로 등록됐다.",
    agentId: "video-qa-runner",
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
