"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Bot,
  ChevronRight,
  Copy,
  FilePenLine,
  FolderOpen,
  LoaderCircle,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Terminal,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  buildAgentBrief,
  companyCharter,
  operatingRules,
  type FootoryAgent,
} from "@/lib/company/ops";
import type { AutomationCatalog } from "@/lib/company/automation";
import type {
  ActivityLog,
  CompanyAlert,
  CheckRun,
  CompanyOverview,
  CompanyState,
  CompanyTask,
  ManagedDocRecord,
} from "@/lib/company/state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PanelKey = "overview" | "tasks" | "agents" | "docs";
type AutomationView = "agents" | "skills" | "plugins";
type TaskDraft = CompanyTask;

type PanelDefinition = {
  id: PanelKey;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
  guide: string;
};

const panels: PanelDefinition[] = [
  {
    id: "overview",
    label: "현황",
    caption: "핵심 상태",
    icon: Activity,
    guide: "긴급 경보와 최근 검증 결과를 먼저 확인한다.",
  },
  {
    id: "tasks",
    label: "업무",
    caption: "작업 지시",
    icon: BriefcaseBusiness,
    guide: "담당자, 목표, 완료 기준을 빠르게 정리한다.",
  },
  {
    id: "agents",
    label: "자동화",
    caption: "agent·skill·plugin",
    icon: ShieldCheck,
    guide: "role agent, workflow skill, local plugin 묶음을 함께 확인한다.",
  },
  {
    id: "docs",
    label: "문서",
    caption: "지침 편집",
    icon: FilePenLine,
    guide: "owner와 목적을 기준으로 canonical 문서를 편집한다.",
  },
];

const panelHowTo: Record<PanelKey, string[]> = {
  overview: [
    "긴급 경보와 최근 검증부터 확인한다.",
    "필요하면 lint, typecheck, test:run을 바로 실행한다.",
    "상세 상태는 하단 보조 영역에서 확인한다.",
  ],
  tasks: [
    "업무를 고르거나 새 업무를 생성한다.",
    "목표와 완료 기준을 짧고 명확하게 작성한다.",
    "brief를 복사해 agent에게 전달한다.",
  ],
  agents: [
    "agent에서 역할 경계와 예시 요청을 확인한다.",
    "skill에서 반복 workflow와 default prompt를 복사한다.",
    "plugin에서 실제 manifest, marketplace, 터미널 명령을 확인한다.",
  ],
  docs: [
    "owner 필터로 대상 문서를 좁힌다.",
    "메타(제목/목적/owner)를 먼저 저장한다.",
    "본문은 필요한 범위만 수정하고 저장한다.",
  ],
};

type GuideSection = {
  title: string;
  description: string;
  items: string[];
};

const operatorGuideSections: GuideSection[] = [
  {
    title: "운영실을 여는 순서",
    description: "처음에는 모든 걸 동시에 보지 말고 아래 순서로만 움직인다.",
    items: [
      "현황에서 긴급 경보, 최근 검증, dirty 파일을 먼저 본다.",
      "업무에서 이번에 처리할 플로우 하나만 골라 담당자와 완료 기준을 잠근다.",
      "자동화에서 이 일을 어떤 agent와 skill 기준으로 다룰지 확인한다.",
      "문서에서 필요한 canonical 문서만 열어 메타와 본문을 수정한다.",
      "검증은 현황 패널의 lint, typecheck, test:run부터 돌리고 결과를 확인한다.",
    ],
  },
  {
    title: "자동화 라우팅 기준",
    description: "agent는 책임 경계, skill은 반복 workflow, plugin은 그 묶음이다.",
    items: [
      "구현은 Core Video Editor를 쓴다.",
      "검증은 Video QA Runner를 쓴다.",
      "문구와 사용성은 UX Copy Reviewer를 쓴다.",
      "single-clip contract 보호는 Playback Contract Guardian을 쓴다.",
      "정리와 문서 archive는 Repo Cleanup Refactorer를 쓴다.",
      "반복 QA smoke는 skill을 우선 쓰고, 필요 시 agent 검토를 붙인다.",
    ],
  },
  {
    title: "자주 하는 실수",
    description: "운영실에서 가장 흔하게 꼬이는 부분만 미리 막는다.",
    items: [
      "업무 하나에 여러 사용자 플로우를 같이 넣지 않는다.",
      "agent를 기능별로 잘게 쪼개지 않는다. 역할 경계가 우선이다.",
      "문서 owner를 편집 담당자로 오해하지 않는다. owner는 판단 책임 주체다.",
      "문서보다 실제 코드가 우선이며, 차이는 문서에 따로 남긴다.",
      "실행하지 않은 검증은 통과 처리하지 않는다.",
    ],
  },
];

const fieldGuideSections: Record<PanelKey, GuideSection[]> = {
  overview: [
    {
      title: "현황에서 보는 것",
      description: "먼저 볼 것은 숫자 자체보다 지금 바로 판단해야 할 이상 신호다.",
      items: [
        "긴급 경보: 지금 바로 확인할 위험이 있는지 본다.",
        "최근 검증: 마지막 lint, typecheck, test:run 상태를 확인한다.",
        "외부 인프라 사용량: 읽기 전용 참고 정보로만 본다.",
        "dirty 파일: 현재 워킹트리 변경 범위를 빠르게 훑는다.",
      ],
    },
  ],
  tasks: [
    {
      title: "업무 항목을 이렇게 쓴다",
      description: "업무는 해결책 설명이 아니라 이번에 닫을 문제 단위로 적는다.",
      items: [
        "업무 제목: 문제를 식별할 이름만 적는다.",
        "담당 agent: 최종 판단 책임을 질 담당자 하나만 고른다.",
        "목표: 완료되면 무엇이 달라지는지 1~2문장으로 적는다.",
        "관련 파일/경로: 지금 바로 열 파일만 남긴다.",
        "근거 문서: 실제로 읽을 canonical 문서만 넣는다.",
        "하지 말 것: 범위 확장이나 위험한 접근을 적는다.",
        "완료 기준: 끝났다고 볼 조건만 적는다.",
        "검증: 실제 실행할 명령만 적는다.",
      ],
    },
  ],
  agents: [
    {
      title: "자동화 항목을 이렇게 본다",
      description: "agent는 책임, skill은 절차, plugin은 배포 묶음으로 나눠 본다.",
      items: [
        "agent: 언제 쓰는지, 무엇을 하지 않는지, 예시 요청을 본다.",
        "skill: 언제 반복 실행하는지, 어떤 출력이 나와야 하는지 본다.",
        "plugin: manifest 경로, marketplace, bundled skill 목록을 본다.",
        "복사 버튼은 root와 ops-console 어디서든 같은 자산을 쓰게 하는 진입점이다.",
      ],
    },
  ],
  docs: [
    {
      title: "문서 항목을 이렇게 쓴다",
      description: "문서 편집은 긴 설명보다 owner와 목적을 명확히 잡는 게 우선이다.",
      items: [
        "문서 제목: 목록에서 바로 찾을 이름으로 적는다.",
        "카테고리: core, video, ux, qa, ops 중 하나만 쓴다.",
        "owner agent: 이 문서의 판단 책임 주체를 고른다.",
        "문서 목적: 왜 존재하는지 한 줄로 적는다.",
        "문서 본문: 필요한 범위만 수정하고 구현과 맞지 않으면 차이를 기록한다.",
      ],
    },
  ],
};

const statusLabel: Record<CompanyTask["status"], string> = {
  queued: "대기",
  in_progress: "진행",
  review: "검토",
  blocked: "막힘",
  done: "완료",
};

const priorityLabel: Record<CompanyTask["priority"], string> = {
  critical: "매우 급함",
  high: "급함",
  normal: "일반",
  low: "낮음",
};

const categoryLabel: Record<ManagedDocRecord["category"], string> = {
  core: "핵심",
  video: "영상",
  ux: "UX",
  qa: "검증",
  ops: "운영",
};

const statusColorClass: Record<CompanyTask["status"], string> = {
  queued: "text-[var(--ops-ink-faint)]",
  in_progress: "text-[var(--ops-accent)]",
  review: "text-[#60a5fa]",
  blocked: "text-[#f87171]",
  done: "text-[#34d399]",
};

const checkColorClass: Record<CheckRun["status"], string> = {
  idle: "text-[var(--ops-ink-faint)]",
  running: "text-[#38bdf8]",
  passed: "text-[#34d399]",
  failed: "text-[#f87171]",
};

const alertBadgeClass: Record<CompanyAlert["kind"], string> = {
  dirty: "border-amber-700/50 bg-amber-950/40 text-amber-300",
  blocker: "border-red-700/50 bg-red-950/40 text-red-300",
  release: "border-orange-700/50 bg-orange-950/40 text-orange-300",
  validation: "border-sky-700/50 bg-sky-950/40 text-sky-300",
};

const alertCardClass: Record<CompanyAlert["kind"], string> = {
  dirty: "border-amber-900/60 bg-[#1d1610] hover:border-amber-700/70 hover:bg-[#261c12]",
  blocker: "border-red-900/60 bg-[#1d1013] hover:border-red-700/70 hover:bg-[#241115]",
  release: "border-orange-900/60 bg-[#1d1510] hover:border-orange-700/70 hover:bg-[#241911]",
  validation: "border-sky-900/60 bg-[#101821] hover:border-sky-700/70 hover:bg-[#111d28]",
};

const infraStatusClass: Record<CompanyOverview["infraUsage"]["services"][number]["status"], string> = {
  ok: "border-emerald-700/50 bg-emerald-950/40 text-emerald-300",
  partial: "border-amber-700/50 bg-amber-950/40 text-amber-300",
  missing: "border-slate-700/50 bg-slate-950/40 text-slate-300",
  error: "border-red-700/50 bg-red-950/40 text-red-300",
};

const activityTypeLabel: Record<ActivityLog["type"], string> = {
  task: "업무",
  agent: "agent",
  doc: "문서",
  check: "검증",
};

const statusStripeClass: Record<CompanyTask["status"], string> = {
  queued: "bg-[var(--ops-ink-faint)]/50",
  in_progress: "bg-[var(--ops-accent)]",
  review: "bg-[#60a5fa]",
  blocked: "bg-[#f87171]",
  done: "bg-[#34d399]",
};

const categoryStripe: Record<ManagedDocRecord["category"], string> = {
  core: "bg-[var(--ops-accent)]",
  video: "bg-[#60a5fa]",
  ux: "bg-[#a78bfa]",
  qa: "bg-[#fb923c]",
  ops: "bg-[var(--ops-ink-muted)]",
};

const activityTypeStripe: Record<ActivityLog["type"], string> = {
  task: "bg-[#60a5fa]",
  agent: "bg-[var(--ops-accent)]",
  doc: "bg-[#a78bfa]",
  check: "bg-[#fb923c]",
};

function emptyTask(agentId: string): TaskDraft {
  return {
    id: "",
    title: "",
    agentId,
    status: "queued",
    priority: "normal",
    goal: "",
    paths: [],
    docs: [],
    constraints: [],
    doneCriteria: [],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: "",
    updatedAt: new Date().toISOString(),
  };
}

function multiline(items: string[]) {
  return items.join("\n");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function pickInfraMetric(
  service: CompanyOverview["infraUsage"]["services"][number] | undefined,
  label: string
) {
  return service?.metrics.find((metric) => metric.label === label)?.value ?? "-";
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "요청에 실패했다.");
  }
  return data as T;
}

function buildTaskFromAgentExample(
  agent: FootoryAgent,
  example: FootoryAgent["examples"][number]
): TaskDraft {
  return {
    id: "",
    title: example.label || "",
    agentId: agent.id,
    status: "queued",
    priority: "normal",
    goal: example.goal || "",
    paths: lines(example.paths || ""),
    docs: [...agent.sourceDocs],
    constraints: [...agent.redFlags],
    doneCriteria: lines(example.done || ""),
    verification: lines(example.verification || "npm run lint\nnpm run typecheck\nnpm run test:run"),
    note: `${agent.name} 기준 예시를 업무 초안으로 변환`,
    updatedAt: new Date().toISOString(),
  };
}

function buildDirtyTaskDraft(alert: CompanyAlert, agentId: string): TaskDraft {
  const paths = alert.detailLines
    .map((line) => line.replace(/^[^ ]+\s+/, "").trim())
    .filter(Boolean);

  return {
    id: "",
    title: `dirty 파일 정리 ${paths.length}건`,
    agentId,
    status: "queued",
    priority: "high",
    goal: "현재 워킹트리 변경을 분류하고, 이번 작업 범위와 보류 대상을 명확히 정리한다.",
    paths,
    docs: ["AGENTS.md", "docs/repo-recovery-plan.md"],
    constraints: [
      "사용자 변경을 임의로 되돌리지 않는다.",
      "범위가 다른 파일을 한 번에 묶어 정리하지 않는다.",
      "실제 호출 근거 없이 삭제나 병합을 진행하지 않는다.",
    ],
    doneCriteria: [
      "현재 변경 파일의 역할을 설명할 수 있다.",
      "이번에 수정할 파일과 보류 파일이 분리되어 있다.",
      "필요한 검증 명령이 명시되어 있다.",
    ],
    verification: ["npm run lint", "npm run typecheck", "npm run test:run"],
    note: alert.detailLines.join("\n"),
    updatedAt: new Date().toISOString(),
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-xl leading-none tracking-wide text-[var(--ops-ink)]">{title}</h3>
        {description ? <p className="mt-2 text-sm text-[var(--ops-ink-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ops-accent)]">{label}</span>
        <span className="text-[10px] text-[var(--ops-ink-faint)]">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function GuideCard({ section }: { section: GuideSection }) {
  return (
    <Card className="bg-[var(--ops-surface-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{section.title}</CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {section.items.map((item, index) => (
            <div key={item} className="flex items-start gap-2.5 rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--ops-accent-soft)] text-[10px] font-bold tabular-nums text-[var(--ops-accent)]">
                {index + 1}
              </span>
              <span className="text-xs leading-relaxed text-[var(--ops-ink-muted)]">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "var(--ops-accent)",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)] p-4">
      <div className="ops-metric-line" style={{ background: accent }} />
      <div className="mb-2 flex items-center justify-between gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ops-ink-faint)]">{label}</p>
        {Icon ? <Icon className="size-3.5 shrink-0 text-[var(--ops-ink-faint)]" /> : null}
      </div>
      <p className="font-display text-3xl leading-none tracking-tight" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function ActivityItem({ entry }: { entry: ActivityLog }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-soft)] p-3 pl-4">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", activityTypeStripe[entry.type])} />
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{activityTypeLabel[entry.type]}</Badge>
        <span className="text-xs text-[var(--ops-ink-faint)]">{formatTime(entry.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--ops-ink)]">{entry.title}</p>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--ops-ink-muted)]">{entry.detail}</p>
      {entry.docPath ? <p className="mt-1 text-xs text-[var(--ops-ink-faint)]">{entry.docPath}</p> : null}
    </article>
  );
}

export default function FootoryCompanyClient() {
  const [panel, setPanel] = useState<PanelKey>("overview");
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [state, setState] = useState<CompanyState | null>(null);
  const [automation, setAutomation] = useState<AutomationCatalog | null>(null);
  const [automationView, setAutomationView] = useState<AutomationView>("agents");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedPluginId, setSelectedPluginId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDocPath, setSelectedDocPath] = useState("");
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [agentDraft, setAgentDraft] = useState<FootoryAgent | null>(null);
  const [docDraft, setDocDraft] = useState<ManagedDocRecord | null>(null);
  const [docContent, setDocContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingOverview, setRefreshingOverview] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [runningCheck, setRunningCheck] = useState<CheckRun["script"] | null>(null);
  const [docOwnerFilter, setDocOwnerFilter] = useState("all");

  const selectedPanel = panels.find((item) => item.id === panel) ?? panels[0];
  const selectedFieldGuides = fieldGuideSections[panel];

  const selectedAgent = useMemo(
    () => state?.agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [selectedAgentId, state?.agents]
  );

  const selectedRegistryAgent = useMemo(
    () => automation?.agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [automation?.agents, selectedAgentId]
  );

  const selectedSkill = useMemo(
    () => automation?.skills.find((skill) => skill.id === selectedSkillId) ?? null,
    [automation?.skills, selectedSkillId]
  );

  const selectedPlugin = useMemo(
    () => automation?.plugins.find((plugin) => plugin.id === selectedPluginId) ?? null,
    [automation?.plugins, selectedPluginId]
  );

  const selectedTask = useMemo(
    () => state?.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, state?.tasks]
  );

  const selectedDoc = useMemo(
    () => state?.docRegistry.find((doc) => doc.path === selectedDocPath) ?? null,
    [selectedDocPath, state?.docRegistry]
  );

  const activeBrief = useMemo(() => {
    if (!taskDraft || !state) return "";
    const owner = state.agents.find((agent) => agent.id === taskDraft.agentId) ?? state.agents[0];
    return buildAgentBrief(owner, {
      goal: taskDraft.goal,
      paths: taskDraft.paths.join(", "),
      done: taskDraft.doneCriteria.join(" / "),
      verification: taskDraft.verification.join(", "),
    });
  }, [state, taskDraft]);

  const filteredDocs = useMemo(
    () => (state?.docRegistry ?? []).filter((doc) => docOwnerFilter === "all" || doc.ownerAgentId === docOwnerFilter),
    [docOwnerFilter, state?.docRegistry]
  );

  const selectedTaskLogs = useMemo(
    () => (state?.activity ?? []).filter((entry) => entry.taskId === taskDraft?.id).slice(0, 8),
    [state?.activity, taskDraft?.id]
  );

  const selectedAgentLogs = useMemo(
    () => (state?.activity ?? []).filter((entry) => entry.agentId === agentDraft?.id).slice(0, 8),
    [state?.activity, agentDraft?.id]
  );

  const recentActivity = useMemo(() => (state?.activity ?? []).slice(0, 6), [state?.activity]);

  const loadOverview = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setRefreshingOverview(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchJson<{ overview: CompanyOverview; state: CompanyState; automation: AutomationCatalog }>("/api/company/overview");
      setOverview(data.overview);
      setState(data.state);
      setAutomation(data.automation);
      setSelectedAgentId((current) => current || data.state.agents[0]?.id || "");
      setSelectedSkillId((current) => current || data.automation.skills[0]?.id || "");
      setSelectedPluginId((current) => current || data.automation.plugins[0]?.id || "");
      setSelectedTaskId((current) => current || data.state.tasks[0]?.id || "");
      setSelectedDocPath((current) => current || data.state.docRegistry[0]?.path || "");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "운영 상태를 불러오지 못했다.");
    } finally {
      if (silent) {
        setRefreshingOverview(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedAgent) return;
    setAgentDraft({ ...selectedAgent });
  }, [selectedAgent]);

  useEffect(() => {
    if (!state) return;
    if (selectedTask) {
      setTaskDraft({ ...selectedTask });
      return;
    }
    setTaskDraft((current) => {
      if (
        current &&
        !selectedTask &&
        current.id === "" &&
        (current.title ||
          current.goal ||
          current.paths.length > 0 ||
          current.docs.length > 0 ||
          current.constraints.length > 0 ||
          current.doneCriteria.length > 0 ||
          current.note)
      ) {
        return current;
      }
      return emptyTask(selectedAgentId || state.agents[0]?.id || "");
    });
  }, [selectedAgentId, selectedTask, state]);

  useEffect(() => {
    if (!selectedDoc) return;
    setDocDraft({ ...selectedDoc });
    const loadDoc = async () => {
      try {
        const data = await fetchJson<{ path: string; title: string; content: string }>(
          `/api/company/docs?path=${encodeURIComponent(selectedDoc.path)}`
        );
        setDocContent(data.content);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "문서를 불러오지 못했다.");
      }
    };
    void loadDoc();
  }, [selectedDoc]);

  useEffect(() => {
    if (filteredDocs.length === 0) return;
    if (!filteredDocs.some((doc) => doc.path === selectedDocPath)) {
      setSelectedDocPath(filteredDocs[0]?.path ?? "");
    }
  }, [filteredDocs, selectedDocPath]);

  const saveTask = async () => {
    if (!taskDraft) return;
    setSaving("task");
    try {
      await fetchJson("/api/company/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "saveTask", task: taskDraft }),
      });
      setFeedback("업무를 저장했다.");
      await loadOverview({ silent: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "업무 저장에 실패했다.");
    } finally {
      setSaving(null);
    }
  };

  const deleteTask = async () => {
    if (!taskDraft?.id) return;
    setSaving("delete-task");
    try {
      await fetchJson("/api/company/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "deleteTask", taskId: taskDraft.id }),
      });
      setSelectedTaskId("");
      setFeedback("업무를 삭제했다.");
      await loadOverview({ silent: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "업무 삭제에 실패했다.");
    } finally {
      setSaving(null);
    }
  };

  const saveDocMeta = async () => {
    if (!docDraft) return;
    setSaving("doc-meta");
    try {
      await fetchJson("/api/company/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "saveDocMeta", doc: docDraft }),
      });
      setFeedback("문서 메타를 저장했다.");
      await loadOverview({ silent: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "문서 메타 저장에 실패했다.");
    } finally {
      setSaving(null);
    }
  };

  const saveDocContent = async () => {
    if (!docDraft) return;
    setSaving("doc-content");
    try {
      await fetchJson("/api/company/docs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: docDraft.path, content: docContent }),
      });
      setFeedback("문서 본문을 저장했다.");
      await loadOverview({ silent: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "문서 본문 저장에 실패했다.");
    } finally {
      setSaving(null);
    }
  };

  const runCheck = async (script: CheckRun["script"]) => {
    setRunningCheck(script);
    try {
      await fetchJson("/api/company/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      setFeedback(`${script} 결과를 업데이트했다.`);
      await loadOverview({ silent: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "검증 실행에 실패했다.");
    } finally {
      setRunningCheck(null);
    }
  };

  const copyBrief = async () => {
    if (!activeBrief) return;
    try {
      await navigator.clipboard.writeText(activeBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      setFeedback("brief를 복사했다.");
    } catch {
      setFeedback("brief 복사에 실패했다.");
    }
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(message);
    } catch {
      setFeedback("복사에 실패했다.");
    }
  };

  const openDoc = (docPath: string) => {
    const exists = state?.docRegistry.some((doc) => doc.path === docPath);
    if (!exists) {
      setFeedback("이 문서는 현재 문서 편집 목록에 등록되어 있지 않다.");
      return;
    }
    setDocOwnerFilter("all");
    setSelectedDocPath(docPath);
    setPanel("docs");
    setFeedback(`${docPath} 문서를 열었다.`);
  };

  const openAlert = (alert: CompanyAlert) => {
    if (alert.kind === "dirty") {
      const ownerId =
        state?.agents.find((agent) => agent.id === "chief-of-staff")?.id ??
        state?.agents[0]?.id ??
        selectedAgentId;
      if (!ownerId) {
        setFeedback("업무 담당자를 찾지 못했다.");
        return;
      }
      setTaskDraft(buildDirtyTaskDraft(alert, ownerId));
      setSelectedTaskId("");
      setPanel("tasks");
      setFeedback(`dirty 파일 기준 업무 초안을 열었다. ${alert.nextStep}`);
      return;
    }

    if (alert.sourcePath) {
      openDoc(alert.sourcePath);
      setFeedback(`${alert.sourcePath} 문서를 열었다. ${alert.nextStep}`);
    }
  };

  const inProgressCount = state?.tasks.filter((task) => task.status === "in_progress").length ?? 0;
  const recentCheck = overview?.checks[0] ?? null;
  const primaryAlerts = overview?.alerts ?? [];
  const focusDocs = overview?.focusDocs.slice(0, 4) ?? [];
  const dirtyFiles = overview?.git.files ?? [];
  const infraUsage = overview?.infraUsage.services ?? [];
  const vercelUsage = infraUsage.find((service) => service.id === "vercel");
  const r2Usage = infraUsage.find((service) => service.id === "r2");
  const supabaseUsage = infraUsage.find((service) => service.id === "supabase");
  const infraIssueCount = infraUsage.filter((service) => service.status !== "ok").length;
  const usageSnapshots = [
    {
      label: "Vercel",
      value: pickInfraMetric(vercelUsage, "최근 배포 목록"),
      detail: `${pickInfraMetric(vercelUsage, "실패 배포")} 실패`,
      tone: vercelUsage?.status ?? "missing",
    },
    {
      label: "R2",
      value: pickInfraMetric(r2Usage, "저장 용량"),
      detail: `${pickInfraMetric(r2Usage, "오브젝트")} 오브젝트`,
      tone: r2Usage?.status ?? "missing",
    },
    {
      label: "Supabase",
      value: pickInfraMetric(supabaseUsage, "합계 row"),
      detail: `${pickInfraMetric(supabaseUsage, "스토리지 버킷")} 버킷`,
      tone: supabaseUsage?.status ?? "missing",
    },
  ] as const;

  if (loading || !state || !overview || !automation || !taskDraft || !agentDraft || !docDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ops-line-strong)] bg-[var(--ops-surface)] px-6 py-4 shadow-[var(--ops-shadow-card)]">
          <LoaderCircle className="size-5 animate-spin text-[var(--ops-accent)]" />
          <p className="font-display text-sm tracking-wide text-[var(--ops-ink-muted)]">운영 화면을 불러오는 중이다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[1480px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-[var(--ops-line-strong)] bg-[linear-gradient(135deg,rgba(78,203,141,0.06)_0%,rgba(16,24,39,0.95)_50%,rgba(14,22,40,0.95)_100%)] px-5 py-5 shadow-[var(--ops-shadow-float)] backdrop-blur-md sm:px-7 sm:py-6"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-[var(--ops-accent)]/30 bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]" variant="secondary">
                local only
              </Badge>
              <Badge className="border border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)] text-[var(--ops-ink-muted)]" variant="secondary">
                ops-state.json 연동
              </Badge>
              <Badge className="border border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)] text-[var(--ops-ink-muted)]" variant="secondary">
                루트 문서 직접 편집
              </Badge>
              <Badge className="border border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)] text-[var(--ops-ink-muted)]" variant="secondary">
                루트 agent·skill·plugin 연동
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--ops-accent)] uppercase">Footory Operations Console</p>
              <h1 className="mt-2 font-display text-4xl leading-none tracking-tight text-[var(--ops-ink)] sm:text-5xl">
                관리자 운영실
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ops-ink-muted)] sm:text-[15px]">
                상위 Footory 저장소를 로컬에서 직접 관리하는 콘솔이다. 핵심 상태를 먼저 보여주고, 업무 지시와 문서 정리를 같은
                흐름으로 연결한다. 이제 root의 agent, skill, plugin 자산도 같은 화면에서 확인할 수 있다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-[var(--ops-accent)] text-[#04130a] hover:bg-[#62d998]">
                    <BookOpenText className="size-4" />
                    운영실 시작 가이드
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl">
                  <SheetHeader>
                    <SheetTitle>운영실 시작 가이드</SheetTitle>
                    <SheetDescription>처음 여는 관리자도 어디부터 봐야 하는지 바로 이해할 수 있게 정리했다.</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="mt-5 h-[calc(100vh-120px)] pr-4">
                    <div className="grid gap-4 pb-6">
                      {operatorGuideSections.map((section) => (
                        <GuideCard key={section.title} section={section} />
                      ))}
                      <Card className="bg-[var(--ops-surface-soft)]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">지금 보고 있는 패널 가이드</CardTitle>
                          <CardDescription>{selectedPanel.label} 패널에서 먼저 할 일</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {panelHowTo[panel].map((step, index) => (
                              <div key={step} className="flex items-start gap-2.5 rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2">
                                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--ops-accent-soft)] text-[10px] font-bold tabular-nums text-[var(--ops-accent)]">
                                  {index + 1}
                                </span>
                                <span className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">{step}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      {selectedFieldGuides.map((section) => (
                        <GuideCard key={`${panel}-${section.title}`} section={section} />
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)] text-[var(--ops-ink)] hover:bg-[var(--ops-surface-muted)]">
                    빠른 문서 열기
                    <ArrowRight className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>오늘 바로 볼 문서</SheetTitle>
                    <SheetDescription>운영 중 자주 다시 여는 문서를 빠르게 열 수 있다.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-5 grid gap-2">
                    {focusDocs.map((doc) => (
                      <Button
                        key={doc.path}
                        variant="outline"
                        className="h-auto justify-start py-3 text-left"
                        onClick={() => openDoc(doc.path)}
                      >
                        <div>
                          <p className="font-semibold">{doc.title}</p>
                          <p className="text-xs text-[var(--ops-ink-faint)]">{doc.path}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/15 hover:text-white lg:hidden">
                    현재 패널 가이드
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>패널 가이드</DrawerTitle>
                    <DrawerDescription>{selectedPanel.label} 화면에서 먼저 할 일</DrawerDescription>
                  </DrawerHeader>
                  <div className="grid gap-4 px-4 pb-4">
                    <ol className="grid gap-2 text-sm text-[var(--ops-ink-muted)]">
                      {panelHowTo[panel].map((step) => (
                        <li key={step} className="rounded-xl bg-[var(--ops-surface-muted)] px-3 py-2">
                          {step}
                        </li>
                      ))}
                    </ol>
                    {selectedFieldGuides.map((section) => (
                      <GuideCard key={`drawer-${panel}-${section.title}`} section={section} />
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="진행 중 업무"
              value={inProgressCount}
              icon={Activity}
              accent="#60a5fa"
            />
            <MetricCard
              label="인프라 이슈"
              value={infraIssueCount}
              icon={TriangleAlert}
              accent={infraIssueCount > 0 ? "#f87171" : "var(--ops-ink-muted)"}
            />
            <MetricCard
              label="긴급 경보"
              value={overview.alerts.length}
              icon={TriangleAlert}
              accent={overview.alerts.length > 0 ? "#fb923c" : "var(--ops-ink-muted)"}
            />
            <MetricCard
              label="최근 점검"
              value={recentCheck?.script ?? "없음"}
              icon={Terminal}
              accent={
                recentCheck?.status === "passed"
                  ? "#34d399"
                  : recentCheck?.status === "failed"
                    ? "#f87171"
                    : "var(--ops-accent)"
              }
            />
          </div>
        </div>
      </motion.header>

      <AnimatePresence initial={false}>
        {feedback ? (
          <motion.div
            key={feedback}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 rounded-xl border border-[var(--ops-accent)]/25 bg-[var(--ops-accent-soft)] px-4 py-3 text-sm text-[var(--ops-accent)]"
          >
            {feedback}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Tabs value={panel} onValueChange={(value) => setPanel(value as PanelKey)} className="mt-4">
        <TabsList className="h-auto w-full overflow-x-auto p-1.5">
          {panels.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger key={item.id} value={item.id} className="min-w-[100px] h-auto flex-col gap-0.5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="ops-tab-caption text-[10px] leading-none">{item.caption}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>현재 선택</CardTitle>
                <CardDescription>편집 대상과 패널 상태를 한 번에 본다.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1.5">
                {([
                  { label: "패널", value: selectedPanel.label, icon: selectedPanel.icon },
                  { label: "업무", value: taskDraft.title || "새 업무", icon: BriefcaseBusiness },
                  { label: "담당자", value: agentDraft.name, icon: ShieldCheck },
                  { label: "문서", value: docDraft.title, icon: FilePenLine },
                ] as Array<{ label: string; value: string; icon: React.ComponentType<{ className?: string }> }>).map(({ label, value, icon: RowIcon }) => (
                  <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2.5">
                    <div className="flex shrink-0 items-center gap-1.5">
                      <RowIcon className="size-3 text-[var(--ops-accent)]/60" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ops-ink-faint)]">{label}</span>
                    </div>
                    <span className="max-w-[130px] truncate text-right text-[13px] font-semibold text-[var(--ops-ink)]">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>운영 원칙</CardTitle>
                <CardDescription>판단 기준이 흐려지지 않게 고정한다.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {companyCharter.map((item) => (
                  <div key={item.title} className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-soft)] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ops-accent)]">{item.title}</p>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[var(--ops-ink-muted)]">{item.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="min-w-0 isolate">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <Card className="overflow-hidden border-[var(--ops-line-strong)] bg-[linear-gradient(135deg,rgba(78,203,141,0.08)_0%,rgba(10,15,28,0.98)_100%)]">
                  <CardHeader>
                    <SectionHeading
                      title="처음이면 여기부터"
                      description="운영실은 현황 확인, 업무 잠금, 담당자 brief, 문서 수정, 검증 확인 순서로 쓰면 된다."
                      action={
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="sm" className="bg-[var(--ops-accent)] text-[#04130a] hover:bg-[#62d998]">
                              <BookOpenText className="size-4" />
                              전체 가이드
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-full sm:max-w-xl">
                            <SheetHeader>
                              <SheetTitle>운영실 시작 가이드</SheetTitle>
                              <SheetDescription>관리자 운영실을 처음 열 때 필요한 순서와 항목 설명을 모아뒀다.</SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="mt-5 h-[calc(100vh-120px)] pr-4">
                              <div className="grid gap-4 pb-6">
                                {operatorGuideSections.map((section) => (
                                  <GuideCard key={`overview-${section.title}`} section={section} />
                                ))}
                              </div>
                            </ScrollArea>
                          </SheetContent>
                        </Sheet>
                      }
                    />
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {operatorGuideSections.slice(0, 2).map((section) => (
                      <div key={section.title} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-[var(--ops-ink)]">{section.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--ops-ink-muted)]">{section.description}</p>
                        <div className="mt-3 grid gap-2">
                          {section.items.slice(0, 3).map((item, index) => (
                            <div key={item} className="flex items-start gap-2 text-xs leading-relaxed text-[var(--ops-ink-muted)]">
                              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--ops-accent-soft)] text-[10px] font-bold text-[var(--ops-accent)]">
                                {index + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedFieldGuides.map((section) => (
                  <GuideCard key={`overview-field-${section.title}`} section={section} />
                ))}
              </div>

              <Card className="bg-[var(--ops-surface-soft)]">
                <CardHeader>
                  <SectionHeading
                    title="로컬 자동화 자산"
                    description="root 저장소의 실제 agent, skill, plugin 자산을 읽어서 보여준다."
                    action={
                      <Button size="sm" variant="secondary" onClick={() => setPanel("agents")}>
                        <Bot className="size-4" />
                        자동화 열기
                      </Button>
                    }
                  />
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "agent", value: overview.automation.agentCount, detail: overview.automation.registryPath },
                    { label: "skill", value: overview.automation.skillCount, detail: overview.automation.marketplacePath },
                    { label: "plugin", value: overview.automation.pluginCount, detail: overview.automation.pluginRoot },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ops-ink-faint)]">{item.label}</p>
                      <p className="mt-3 font-display text-3xl leading-none text-[var(--ops-accent)]">{item.value}</p>
                      <p className="mt-3 break-all font-mono text-[11px] leading-relaxed text-[var(--ops-ink-faint)]">{item.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <SectionHeading
                    title="핵심 상태"
                    description="개발 관리자 기준으로 사용량, 배포 상태, 검증 상태를 먼저 본다."
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-[var(--ops-line-strong)] bg-[var(--ops-surface-soft)]"
                        onClick={() => void loadOverview({ silent: true })}
                        disabled={refreshingOverview}
                      >
                        <RefreshCw className={cn("size-4", refreshingOverview && "animate-spin")} />
                        새로고침
                      </Button>
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-[var(--ops-line-strong)] bg-[linear-gradient(135deg,#11251c_0%,#0b1323_42%,#0f172a_100%)] p-4 shadow-[var(--ops-shadow-soft)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ops-accent)]">Infra Usage</p>
                        <h4 className="mt-2 font-display text-2xl tracking-wide text-[var(--ops-ink)]">지금 바로 판단할 사용량</h4>
                        <p className="mt-2 text-sm text-[var(--ops-ink-muted)]">
                          읽기 전용 조회 · {formatTime(overview.infraUsage.fetchedAt)} · 문제 서비스 {infraIssueCount}개
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ops-ink-faint)]">최근 배포</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ops-ink)]">{pickInfraMetric(vercelUsage, "최근 배포")}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      {usageSnapshots.map((snapshot) => (
                        <div
                          key={snapshot.label}
                          className="rounded-2xl border border-white/10 bg-[#121a28] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--ops-ink)]">{snapshot.label}</p>
                            <Badge variant="outline" className={cn("text-[10px]", infraStatusClass[snapshot.tone])}>
                              {snapshot.tone === "ok" ? "정상" : snapshot.tone === "partial" ? "부분" : snapshot.tone === "error" ? "오류" : "누락"}
                            </Badge>
                          </div>
                          <p className="mt-4 font-display text-3xl leading-none tracking-tight text-white">{snapshot.value}</p>
                          <p className="mt-2 text-xs text-[var(--ops-ink-muted)]">{snapshot.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="bg-[var(--ops-surface-soft)]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ops-ink-faint)]">긴급 경보</CardTitle>
                          <CardDescription className="mt-1">Blocker는 지금 배포를 막는 문제다. 항목 안의 `의미`와 `눌러서 할 일`을 보고 바로 문서 편집이나 업무 초안으로 이동한다.</CardDescription>
                        </div>
                        {primaryAlerts.length > 0 ? (
                          <Badge variant="outline" className="border-red-700/50 bg-red-950/40 text-red-400 tabular-nums">
                            {primaryAlerts.length}
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {primaryAlerts.length > 0 ? (
                        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                          {primaryAlerts.map((alert) => (
                            <button
                              key={alert.id}
                              type="button"
                              onClick={() => openAlert(alert)}
                              className={cn(
                                "grid w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ops-surface-soft)]",
                                alertCardClass[alert.kind]
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className={cn("text-[10px]", alertBadgeClass[alert.kind])}>
                                        {alert.label}
                                      </Badge>
                                      <span className="text-[11px] text-[var(--ops-ink-faint)]">{alert.sourceLabel}</span>
                                    </div>
                                    <p className="mt-2 whitespace-normal break-words text-sm leading-relaxed text-[var(--ops-ink)]">
                                      {alert.summary}
                                    </p>
                                    <div className="mt-3 grid gap-2">
                                      <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ops-ink-faint)]">의미</p>
                                        <p className="mt-1 text-xs leading-relaxed text-[var(--ops-ink-muted)]">{alert.meaning}</p>
                                      </div>
                                      <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ops-ink-faint)]">눌러서 할 일</p>
                                        <p className="mt-1 text-xs leading-relaxed text-[var(--ops-ink-muted)]">{alert.nextStep}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--ops-accent)]">
                                  {alert.actionLabel}
                                  <ArrowRight className="size-3.5" />
                                </span>
                              </div>
                              {alert.kind === "dirty" && alert.detailLines.length > 0 ? (
                                <div className="grid gap-1 rounded-lg border border-white/6 bg-[#0d1420] px-3 py-2">
                                  {alert.detailLines.slice(0, 3).map((line) => (
                                    <p key={`${alert.id}-${line}`} className="text-xs leading-relaxed text-[var(--ops-ink-muted)]">
                                      {line}
                                    </p>
                                  ))}
                                  {alert.detailLines.length > 3 ? (
                                    <p className="text-[11px] text-[var(--ops-ink-faint)]">
                                      외 {alert.detailLines.length - 3}개 더 있음
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-[var(--ops-accent-soft)] px-3 py-2">
                          <span className="text-xs text-[var(--ops-accent)]">경보 없음</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 md:grid-cols-2">
                    {/* 최근 검증 */}
                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ops-ink-faint)]">최근 검증</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recentCheck ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-[var(--ops-surface-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--ops-ink)]">
                                {recentCheck.script}
                              </code>
                              <Badge
                                variant="secondary"
                                className={cn("text-xs", checkColorClass[recentCheck.status])}
                              >
                                {recentCheck.summary}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[var(--ops-ink-faint)]">
                              {formatTime(recentCheck.finishedAt ?? recentCheck.startedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--ops-ink-muted)]">아직 실행된 검증이 없다.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* 점검 실행 */}
                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ops-ink-faint)]">점검 실행</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        {(["lint", "typecheck", "test:run"] as CheckRun["script"][]).map((script) => (
                          <Button
                            key={script}
                            variant="secondary"
                            className="justify-start font-mono text-xs"
                            onClick={() => void runCheck(script)}
                            disabled={runningCheck === script}
                          >
                            {runningCheck === script ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                              <Terminal className="size-3.5" />
                            )}
                            {script}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-[var(--ops-surface-soft)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">외부 인프라 사용량</CardTitle>
                      <CardDescription>서비스별로 필요한 수치만 빠르게 확인한다.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                      {infraUsage.map((service) => (
                        <div
                          key={service.id}
                          className="rounded-2xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[var(--ops-ink)]">{service.label}</p>
                              <p className="mt-1 text-[11px] text-[var(--ops-ink-faint)]">{service.summary}</p>
                            </div>
                            <Badge variant="outline" className={cn("text-[10px]", infraStatusClass[service.status])}>
                              {service.status}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-2">
                            {service.metrics.length > 0 ? (
                              service.metrics.map((metric) => (
                                <div
                                  key={`${service.id}-${metric.label}`}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-soft)] px-3 py-2"
                                >
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ops-ink-faint)]">{metric.label}</span>
                                  <span className="text-sm font-bold text-[var(--ops-ink)]">{metric.value}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-[var(--ops-ink-faint)]">조회 가능한 수치가 없다.</p>
                            )}
                          </div>
                          {service.notes.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {service.notes.slice(0, 2).map((note) => (
                                <p key={`${service.id}-${note}`} className="text-[11px] leading-relaxed text-[var(--ops-ink-faint)]">
                                  {note}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">상세 현황</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {overview.resources.map((resource) => (
                            <div
                              key={resource.label}
                              className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">{resource.label}</p>
                              <p className="font-display text-2xl leading-none text-[var(--ops-accent)]">{resource.count}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--ops-ink-muted)]">{resource.detail}</p>
                            </div>
                          ))}
                        </div>
                        <ScrollArea className="h-36 rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-2">
                          <div className="grid gap-1">
                            {dirtyFiles.length > 0 ? (
                              dirtyFiles.map((file) => {
                                const isNew = file.status.includes("?");
                                const isDeleted = file.status === "D";
                                const isModified = file.status === "M" || file.status === " M";
                                return (
                                  <div
                                    key={`${file.status}-${file.path}`}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--ops-surface-soft)] px-2 py-1.5"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "shrink-0 font-mono text-[10px] px-1.5 py-0",
                                        isNew && "border-blue-700/50 bg-blue-950/40 text-blue-400",
                                        isDeleted && "border-red-700/50 bg-red-950/40 text-red-400",
                                        isModified && "border-amber-700/50 bg-amber-950/40 text-amber-400",
                                        !isNew && !isDeleted && !isModified && "text-[var(--ops-ink-muted)]"
                                      )}
                                    >
                                      {file.status.trim()}
                                    </Badge>
                                    <span className="min-w-0 truncate font-mono text-xs text-[var(--ops-ink)]">{file.path}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="px-2 py-3 text-xs text-[var(--ops-ink-muted)]">변경된 파일이 없다.</p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">로컬 연결 정보</CardTitle>
                        <CardDescription>개발 관리자 기준으로 필요할 때만 아래에서 확인한다.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        {[
                          { label: "접속 허용", value: overview.workspace.allowedHosts.join(", "), mono: false },
                          { label: "콘솔 위치", value: overview.workspace.consolePath, mono: true },
                          { label: "운영 저장소", value: overview.workspace.repoPath, mono: true },
                          { label: "상태 파일", value: overview.workspace.stateFilePath, mono: true },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ops-ink-faint)]">{label}</p>
                            <p className={cn("mt-2 break-all text-[13px] leading-relaxed text-[var(--ops-ink)]", mono && "font-mono text-xs")}>{value}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 space-y-4">
              {selectedFieldGuides.map((section) => (
                <GuideCard key={`tasks-${section.title}`} section={section} />
              ))}
              <Card>
                <CardHeader>
                  <SectionHeading
                    title="업무 작성"
                    description="목록에서 선택하고, 목표와 완료 기준을 명확하게 저장한다."
                    action={
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void copyBrief()}>
                          <Copy className="size-4" />
                          {copied ? "복사됨" : "brief 복사"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" title="업무 액션 더보기">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>업무 액션</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTaskId("");
                                setTaskDraft(emptyTask(selectedAgentId || state.agents[0]?.id || ""));
                              }}
                            >
                              <Plus className="size-4" />
                              새 업무
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    }
                  />
                </CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <Card className="bg-[var(--ops-surface-soft)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">업무 목록</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[520px] pr-2">
                        <div className="grid gap-2">
                          {state.tasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-xl border px-3 py-2.5 pl-4 text-left transition-all",
                                selectedTaskId === task.id
                                  ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] ring-1 ring-[var(--ops-accent)]/30"
                                  : "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] hover:border-[var(--ops-line-strong)] hover:bg-[var(--ops-surface-soft)]"
                              )}
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <div className={cn("absolute inset-y-0 left-0 w-0.5", statusStripeClass[task.status])} />
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ops-ink)]">{task.title}</p>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Badge
                                    variant="secondary"
                                    className={cn("text-[10px] px-1.5 py-0", statusColorClass[task.status])}
                                  >
                                    {statusLabel[task.status]}
                                  </Badge>
                                  <ChevronRight className="size-3.5 text-[var(--ops-ink-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                              <p className="mt-1 truncate text-xs text-[var(--ops-ink-faint)]">
                                <span className="font-medium">{priorityLabel[task.priority]}</span>
                                {" · "}
                                {state.agents.find((agent) => agent.id === task.agentId)?.name ?? task.agentId}
                              </p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <FieldBlock label="업무 제목" hint="한 줄로 식별 가능해야 한다.">
                        <Input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} />
                      </FieldBlock>
                      <FieldBlock label="담당 agent" hint="이 업무를 주로 판단할 주체를 지정한다.">
                        <Select value={taskDraft.agentId} onValueChange={(value) => setTaskDraft({ ...taskDraft, agentId: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {state.agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="상태" hint="대기/진행/검토/막힘/완료">
                        <Select
                          value={taskDraft.status}
                          onValueChange={(value) => setTaskDraft({ ...taskDraft, status: value as CompanyTask["status"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabel).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="우선순위" hint="일정과 영향 기준으로 고른다.">
                        <Select
                          value={taskDraft.priority}
                          onValueChange={(value) =>
                            setTaskDraft({ ...taskDraft, priority: value as CompanyTask["priority"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(priorityLabel).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                    </div>

                    <FieldBlock label="목표" hint="완료 시점 상태를 1~2문장으로 작성한다.">
                      <Textarea rows={3} value={taskDraft.goal} onChange={(event) => setTaskDraft({ ...taskDraft, goal: event.target.value })} />
                    </FieldBlock>
                    <FieldBlock label="관련 파일/경로" hint="agent가 바로 열 파일만 줄바꿈으로 입력한다.">
                      <Textarea
                        rows={4}
                        value={multiline(taskDraft.paths)}
                        onChange={(event) => setTaskDraft({ ...taskDraft, paths: lines(event.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label="근거 문서" hint="판단 기준 문서만 유지한다.">
                      <Textarea
                        rows={3}
                        value={multiline(taskDraft.docs)}
                        onChange={(event) => setTaskDraft({ ...taskDraft, docs: lines(event.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label="하지 말 것" hint="범위 확장 금지나 위험한 접근을 지정한다.">
                      <Textarea
                        rows={3}
                        value={multiline(taskDraft.constraints)}
                        onChange={(event) => setTaskDraft({ ...taskDraft, constraints: lines(event.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label="완료 기준" hint="완료 판정을 줄 단위로 고정한다.">
                      <Textarea
                        rows={3}
                        value={multiline(taskDraft.doneCriteria)}
                        onChange={(event) => setTaskDraft({ ...taskDraft, doneCriteria: lines(event.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label="검증 명령" hint="반드시 실행할 명령만 입력한다.">
                      <Textarea
                        rows={3}
                        value={multiline(taskDraft.verification)}
                        onChange={(event) => setTaskDraft({ ...taskDraft, verification: lines(event.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label="운영 메모" hint="배경이 필요할 때만 짧게 기록한다.">
                      <Textarea rows={2} value={taskDraft.note} onChange={(event) => setTaskDraft({ ...taskDraft, note: event.target.value })} />
                    </FieldBlock>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void saveTask()} disabled={saving === "task"}>
                        {saving === "task" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                        업무 저장
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" disabled={!taskDraft.id || saving === "delete-task"}>
                            <Trash2 className="size-4" />
                            삭제
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>업무를 삭제할까?</DialogTitle>
                            <DialogDescription>
                              삭제하면 업무 목록에서 제거된다. 필요하면 먼저 메모나 brief를 복사해 둔다.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="secondary">취소</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={() => void deleteTask()} disabled={saving === "delete-task"}>
                              {saving === "delete-task" ? <LoaderCircle className="size-4 animate-spin" /> : null}
                              삭제 확정
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">전달용 brief</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3 text-xs leading-relaxed text-[var(--ops-ink)]">
                          {activeBrief || "brief 내용이 아직 없다."}
                        </pre>
                      </CardContent>
                    </Card>

                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">업무 히스토리</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {taskDraft.id && selectedTaskLogs.length > 0 ? (
                          <div className="grid gap-2">
                            {selectedTaskLogs.map((entry) => (
                              <ActivityItem key={entry.id} entry={entry} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--ops-ink-muted)]">아직 이 업무에 쌓인 히스토리가 없다.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="mt-0 space-y-4">
              {selectedFieldGuides.map((section) => (
                <GuideCard key={`agents-${section.title}`} section={section} />
              ))}
              <Card>
                <CardHeader>
                  <SectionHeading
                    title="자동화 자산"
                    description="role agent, workflow skill, local plugin 묶음을 root 저장소 실제 파일 기준으로 본다."
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={automationView} onValueChange={(value) => setAutomationView(value as AutomationView)}>
                    <TabsList className="h-auto w-full p-1.5">
                      <TabsTrigger value="agents" className="gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        agent
                      </TabsTrigger>
                      <TabsTrigger value="skills" className="gap-1.5">
                        <Terminal className="size-3.5" />
                        skill
                      </TabsTrigger>
                      <TabsTrigger value="plugins" className="gap-1.5">
                        <Package className="size-3.5" />
                        plugin
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="agents" className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                      <Card className="bg-[var(--ops-surface-soft)]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">agent 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[560px] pr-2">
                            <div className="grid gap-2">
                              {automation.agents.map((agent) => (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => setSelectedAgentId(agent.id)}
                                  className={cn(
                                    "group cursor-pointer grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                                    selectedAgentId === agent.id
                                      ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] ring-1 ring-[var(--ops-accent)]/30"
                                      : "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] hover:border-[var(--ops-line-strong)] hover:bg-[var(--ops-surface-soft)]"
                                  )}
                                >
                                  <Avatar className="size-8">
                                    <AvatarFallback className="text-xs">{initials(agent.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--ops-ink)]">{agent.name}</p>
                                    <p className="truncate text-xs text-[var(--ops-ink-faint)]">
                                      <span>{agent.tier === "core" ? "권장" : "선택"}</span>
                                      <span className="mx-1 opacity-40">·</span>
                                      <span>{agent.title}</span>
                                    </p>
                                  </div>
                                  <ChevronRight className="size-3.5 text-[var(--ops-ink-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        {selectedRegistryAgent ? (
                          <>
                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <SectionHeading
                                  title={selectedRegistryAgent.name}
                                  description={selectedRegistryAgent.summary}
                                  action={
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => void copyText(`npm run ops:agent -- ${selectedRegistryAgent.id}`, "root agent 명령을 복사했다.")}
                                      >
                                        <Copy className="size-4" />
                                        root 명령
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => void copyText(`npm --prefix ops-console run automation:agent -- ${selectedRegistryAgent.id}`, "ops-console agent 명령을 복사했다.")}
                                      >
                                        <Copy className="size-4" />
                                        ops 명령
                                      </Button>
                                    </div>
                                  }
                                />
                              </CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">구분</p>
                                  <p className="mt-2 text-sm font-semibold text-[var(--ops-ink)]">{selectedRegistryAgent.tier === "core" ? "권장 agent" : "선택 agent"}</p>
                                </div>
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">prompt 파일</p>
                                  <p className="mt-2 break-all font-mono text-xs text-[var(--ops-ink)]">{selectedRegistryAgent.promptPath}</p>
                                </div>
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">업무 초안</p>
                                  <Button size="sm" variant="ghost" className="mt-2 px-0" onClick={() => setPanel("tasks")}>
                                    업무 탭으로 이동
                                    <ArrowRight className="size-3.5" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-2">
                              <Card className="bg-[var(--ops-surface-soft)]">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">이 agent가 맡는 일</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                  {selectedRegistryAgent.responsibilities.map((item) => (
                                    <div key={item} className="rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)]">
                                      {item}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>

                              <Card className="bg-[var(--ops-surface-soft)]">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">하지 않는 일</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                  {selectedRegistryAgent.mustNot.map((item) => (
                                    <div key={item} className="rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)]">
                                      {item}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            </div>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">먼저 읽을 문서</CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-2 md:grid-cols-2">
                                {selectedRegistryAgent.mustRead.map((item) => (
                                  <Button
                                    key={item}
                                    variant="secondary"
                                    className="h-auto min-w-0 justify-start px-3 py-2 text-left"
                                    onClick={() => openDoc(item)}
                                  >
                                    <FolderOpen className="size-3.5 shrink-0" />
                                    <span className="min-w-0 break-all text-xs">{item}</span>
                                  </Button>
                                ))}
                              </CardContent>
                            </Card>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">복붙해서 쓰는 요청 예시</CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-3">
                                {selectedRegistryAgent.typicalPrompts.map((prompt) => (
                                  <div key={prompt} className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                    <p className="text-sm leading-relaxed text-[var(--ops-ink)]">{prompt}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button size="sm" variant="secondary" onClick={() => void copyText(prompt, "agent 예시 요청을 복사했다.")}>
                                        <Copy className="size-4" />
                                        예시 복사
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          if (!selectedAgent) return;
                                          const example = selectedAgent.examples[0];
                                          setTaskDraft(buildTaskFromAgentExample(selectedAgent, example));
                                          setSelectedTaskId("");
                                          setPanel("tasks");
                                          setFeedback(`${selectedRegistryAgent.name} 기준 업무 초안을 열었다.`);
                                        }}
                                      >
                                        업무 초안으로 열기
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">최근 처리 로그</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {selectedAgentLogs.length > 0 ? (
                                  <div className="grid gap-2">
                                    {selectedAgentLogs.map((entry) => (
                                      <ActivityItem key={entry.id} entry={entry} />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-[var(--ops-ink-muted)]">아직 이 agent에 연결된 로그가 없다.</p>
                                )}
                              </CardContent>
                            </Card>
                          </>
                        ) : null}
                      </div>
                    </TabsContent>

                    <TabsContent value="skills" className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                      <Card className="bg-[var(--ops-surface-soft)]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">skill 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[520px] pr-2">
                            <div className="grid gap-2">
                              {automation.skills.map((skill) => (
                                <button
                                  key={skill.id}
                                  type="button"
                                  onClick={() => setSelectedSkillId(skill.id)}
                                  className={cn(
                                    "group rounded-xl border px-3 py-2.5 text-left transition-all",
                                    selectedSkillId === skill.id
                                      ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] ring-1 ring-[var(--ops-accent)]/30"
                                      : "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] hover:border-[var(--ops-line-strong)] hover:bg-[var(--ops-surface-soft)]"
                                  )}
                                >
                                  <p className="text-sm font-semibold text-[var(--ops-ink)]">{skill.name}</p>
                                  <p className="mt-1 text-xs text-[var(--ops-ink-faint)]">{skill.pluginId}</p>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        {selectedSkill ? (
                          <>
                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <SectionHeading
                                  title={selectedSkill.name}
                                  description={selectedSkill.summary}
                                  action={
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button size="sm" variant="secondary" onClick={() => void copyText(selectedSkill.defaultPrompt, "skill default prompt를 복사했다.")}>
                                        <Copy className="size-4" />
                                        prompt 복사
                                      </Button>
                                      <Button size="sm" variant="secondary" onClick={() => void copyText(`npm run ops:skill -- ${selectedSkill.id}`, "root skill 명령을 복사했다.")}>
                                        <Copy className="size-4" />
                                        root 명령
                                      </Button>
                                    </div>
                                  }
                                />
                              </CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">skill 파일</p>
                                  <p className="mt-2 break-all font-mono text-xs text-[var(--ops-ink)]">{selectedSkill.skillPath}</p>
                                </div>
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">default prompt</p>
                                  <p className="mt-2 text-sm leading-relaxed text-[var(--ops-ink)]">{selectedSkill.defaultPrompt}</p>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-2">
                              <Card className="bg-[var(--ops-surface-soft)]">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">언제 쓰나</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                  {selectedSkill.whenToUse.map((item) => (
                                    <div key={item} className="rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)]">
                                      {item}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>

                              <Card className="bg-[var(--ops-surface-soft)]">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">기대 출력</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                  {selectedSkill.outputs.map((item) => (
                                    <div key={item} className="rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)]">
                                      {item}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            </div>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">ops-console에서 쓰는 명령</CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-2">
                                {[
                                  `npm run ops:skill -- ${selectedSkill.id}`,
                                  `npm --prefix ops-console run automation:skill -- ${selectedSkill.id}`,
                                ].map((command) => (
                                  <button
                                    key={command}
                                    type="button"
                                    onClick={() => void copyText(command, "skill 명령을 복사했다.")}
                                    className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2 text-left font-mono text-xs text-[var(--ops-ink)]"
                                  >
                                    {command}
                                  </button>
                                ))}
                              </CardContent>
                            </Card>
                          </>
                        ) : null}
                      </div>
                    </TabsContent>

                    <TabsContent value="plugins" className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                      <Card className="bg-[var(--ops-surface-soft)]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">plugin 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {automation.plugins.map((plugin) => (
                              <button
                                key={plugin.id}
                                type="button"
                                onClick={() => setSelectedPluginId(plugin.id)}
                                className={cn(
                                  "rounded-xl border px-3 py-2.5 text-left transition-all",
                                  selectedPluginId === plugin.id
                                    ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] ring-1 ring-[var(--ops-accent)]/30"
                                    : "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] hover:border-[var(--ops-line-strong)] hover:bg-[var(--ops-surface-soft)]"
                                )}
                              >
                                <p className="text-sm font-semibold text-[var(--ops-ink)]">{plugin.displayName}</p>
                                <p className="mt-1 text-xs text-[var(--ops-ink-faint)]">{plugin.id}</p>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        {selectedPlugin ? (
                          <>
                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <SectionHeading
                                  title={selectedPlugin.displayName}
                                  description={selectedPlugin.summary}
                                  action={
                                    <Button size="sm" variant="secondary" onClick={() => void copyText(`npm run ops:plugin -- ${selectedPlugin.id}`, "plugin 명령을 복사했다.")}>
                                      <Copy className="size-4" />
                                      manifest 명령
                                    </Button>
                                  }
                                />
                              </CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">manifest</p>
                                  <p className="mt-2 break-all font-mono text-xs text-[var(--ops-ink)]">{selectedPlugin.pluginPath}</p>
                                </div>
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">marketplace</p>
                                  <p className="mt-2 break-all font-mono text-xs text-[var(--ops-ink)]">{selectedPlugin.marketplacePath}</p>
                                </div>
                                <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ops-ink-faint)]">registry</p>
                                  <p className="mt-2 break-all font-mono text-xs text-[var(--ops-ink)]">{selectedPlugin.agentRegistryPath}</p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">포함된 skill</CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-2">
                                {selectedPlugin.skillIds.map((skillId) => {
                                  const skill = automation.skills.find((item) => item.id === skillId);
                                  return (
                                    <button
                                      key={skillId}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSkillId(skillId);
                                        setAutomationView("skills");
                                      }}
                                      className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2 text-left"
                                    >
                                      <p className="text-sm font-semibold text-[var(--ops-ink)]">{skill?.name ?? skillId}</p>
                                      <p className="mt-1 text-xs text-[var(--ops-ink-faint)]">{skill?.summary ?? skillId}</p>
                                    </button>
                                  );
                                })}
                              </CardContent>
                            </Card>

                            <Card className="bg-[var(--ops-surface-soft)]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">빠른 명령</CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-2">
                                {selectedPlugin.commands.map((command) => (
                                  <button
                                    key={command}
                                    type="button"
                                    onClick={() => void copyText(command, "plugin 빠른 명령을 복사했다.")}
                                    className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2 text-left font-mono text-xs text-[var(--ops-ink)]"
                                  >
                                    {command}
                                  </button>
                                ))}
                              </CardContent>
                            </Card>
                          </>
                        ) : null}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="mt-0 space-y-4">
              {selectedFieldGuides.map((section) => (
                <GuideCard key={`docs-${section.title}`} section={section} />
              ))}
              <Card>
                <CardHeader>
                  <SectionHeading
                    title="문서 편집"
                    description="owner 필터로 문서를 좁히고 메타와 본문을 같은 화면에서 수정한다."
                    action={
                      <Select value={docOwnerFilter} onValueChange={(value) => setDocOwnerFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 owner</SelectItem>
                          {state.agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                  />
                </CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <Card className="bg-[var(--ops-surface-soft)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">문서 목록</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[560px] pr-2">
                        <div className="grid gap-2">
                          {filteredDocs.map((doc) => (
                            <button
                              key={doc.path}
                              type="button"
                              onClick={() => setSelectedDocPath(doc.path)}
                              className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-xl border px-3 py-2.5 pl-4 text-left transition-all",
                                selectedDocPath === doc.path
                                  ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] ring-1 ring-[var(--ops-accent)]/30"
                                  : "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] hover:border-[var(--ops-line-strong)] hover:bg-[var(--ops-surface-soft)]"
                              )}
                            >
                              <div className={cn("absolute inset-y-0 left-0 w-0.5", categoryStripe[doc.category])} />
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ops-ink)]">{doc.title}</p>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5">{categoryLabel[doc.category]}</Badge>
                                  <ChevronRight className="size-3.5 text-[var(--ops-ink-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--ops-ink-faint)]">{doc.purpose}</p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <FieldBlock label="문서 제목" hint="목록에서 바로 찾을 이름">
                        <Input value={docDraft.title} onChange={(event) => setDocDraft({ ...docDraft, title: event.target.value })} />
                      </FieldBlock>
                      <FieldBlock label="카테고리" hint="핵심/영상/UX/검증/운영">
                        <Select
                          value={docDraft.category}
                          onValueChange={(value) =>
                            setDocDraft({ ...docDraft, category: value as ManagedDocRecord["category"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabel).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="owner agent" hint="문서 책임 주체">
                        <Select
                          value={docDraft.ownerAgentId}
                          onValueChange={(value) => setDocDraft({ ...docDraft, ownerAgentId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {state.agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="문서 목적" hint="존재 이유를 짧게">
                        <Input value={docDraft.purpose} onChange={(event) => setDocDraft({ ...docDraft, purpose: event.target.value })} />
                      </FieldBlock>
                    </div>

                    <Card className="bg-[var(--ops-surface-soft)]">
                      <CardContent className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                        <p className="min-w-0 flex-1 break-all text-sm text-[var(--ops-ink-muted)]">
                          현재 편집 대상: <span className="font-semibold text-[var(--ops-ink)]">{docDraft.path}</span>
                        </p>
                        <Button variant="secondary" onClick={() => void saveDocMeta()} disabled={saving === "doc-meta"}>
                          {saving === "doc-meta" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                          메타 저장
                        </Button>
                      </CardContent>
                    </Card>

                    <FieldBlock label="문서 본문" hint="저장 시 루트 저장소 문서를 직접 업데이트한다.">
                      <Textarea
                        rows={24}
                        className="font-mono text-xs leading-relaxed"
                        value={docContent}
                        onChange={(event) => setDocContent(event.target.value)}
                      />
                    </FieldBlock>

                    <div className="flex justify-end">
                      <Button onClick={() => void saveDocContent()} disabled={saving === "doc-content"}>
                        {saving === "doc-content" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                        본문 저장
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </main>

          <aside className="hidden space-y-4 lg:block lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>사용 가이드</CardTitle>
                <CardDescription>{selectedPanel.guide}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2">
                  {panelHowTo[panel].map((step, index) => (
                    <li key={step} className="flex items-start gap-2.5 rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--ops-accent-soft)] text-[10px] font-bold tabular-nums text-[var(--ops-accent)]">
                        {index + 1}
                      </span>
                      <span className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {selectedFieldGuides.map((section) => (
              <GuideCard key={`aside-${panel}-${section.title}`} section={section} />
            ))}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>항상 지킬 것</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {operatingRules.slice(0, 4).map((rule, index) => (
                  <div key={rule} className="flex items-start gap-2.5 rounded-lg bg-[var(--ops-surface-muted)] px-3 py-2">
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold tabular-nums text-[var(--ops-accent)]/60">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>최근 검증 로그</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.checks.length > 0 ? (
                  <div className="grid gap-2">
                    {overview.checks.slice(0, 4).map((check) => (
                      <div key={check.id} className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <code className="rounded bg-[var(--ops-surface-soft)] px-1.5 py-0.5 font-mono text-xs text-[var(--ops-ink)]">
                            {check.script}
                          </code>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", checkColorClass[check.status])}
                          >
                            {check.summary}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[10px] text-[var(--ops-ink-faint)]">{formatTime(check.finishedAt ?? check.startedAt)}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-[var(--ops-ink-muted)]">{check.output}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ops-ink-muted)]">아직 실행된 검증이 없다.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>최근 운영 로그</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="grid gap-2">
                      {recentActivity.map((entry) => (
                        <ActivityItem key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-[var(--ops-ink-muted)]">아직 쌓인 운영 로그가 없다.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </Tabs>
    </div>
  );
}
