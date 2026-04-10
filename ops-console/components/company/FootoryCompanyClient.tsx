"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Copy,
  FilePenLine,
  FolderOpen,
  Info,
  LoaderCircle,
  Plus,
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
import type {
  ActivityLog,
  CheckRun,
  CompanyOverview,
  CompanyState,
  CompanyTask,
  ManagedDocRecord,
} from "@/lib/company/state";

type PanelKey = "overview" | "tasks" | "agents" | "docs";
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
    caption: "지금 상태와 점검",
    icon: Activity,
    guide: "긴급 경보, 최근 검증, 현재 변경량을 먼저 보는 화면이다.",
  },
  {
    id: "tasks",
    label: "업무",
    caption: "누구에게 무엇을 맡길지",
    icon: BriefcaseBusiness,
    guide: "업무를 만들고, 담당 agent와 완료 기준을 정리하는 화면이다.",
  },
  {
    id: "agents",
    label: "담당자",
    caption: "agent 역할과 금지선",
    icon: ShieldCheck,
    guide: "agent가 맡을 일과 맡지 않을 일을 관리하는 화면이다.",
  },
  {
    id: "docs",
    label: "문서",
    caption: "지침서와 운영 문서",
    icon: FilePenLine,
    guide: "canonical 문서의 owner, 목적, 본문을 관리하는 화면이다.",
  },
];

const panelHowTo: Record<PanelKey, string[]> = {
  overview: [
    "긴급 경보와 최근 검증부터 본다.",
    "필요하면 lint, typecheck, test:run 중 하나를 실행한다.",
    "상세 목록은 아래 접힘 영역에서만 확인한다.",
  ],
  tasks: [
    "왼쪽 목록에서 업무를 선택한다.",
    "가운데 폼에 목표, 관련 파일, 완료 기준을 적는다.",
    "저장 후 brief를 복사해 agent에게 바로 전달한다.",
  ],
  agents: [
    "왼쪽에서 agent를 고른다.",
    "이 agent가 맡을 일과 금지할 일을 짧게 정리한다.",
    "변경 후 저장해 지시 기준을 잠근다.",
  ],
  docs: [
    "왼쪽에서 수정할 문서를 고른다.",
    "owner와 목적을 먼저 확인한다.",
    "본문은 필요한 경우에만 수정하고 바로 저장한다.",
  ],
};

const statusLabel: Record<CompanyTask["status"], string> = {
  queued: "대기",
  in_progress: "진행 중",
  review: "검토 중",
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
  ux: "사용성",
  qa: "검증",
  ops: "운영",
};

const statusTone: Record<CompanyTask["status"], string> = {
  queued: "var(--text-dim)",
  in_progress: "var(--gold-strong)",
  review: "var(--cyan)",
  blocked: "var(--red)",
  done: "var(--green)",
};

const checkTone: Record<CheckRun["status"], string> = {
  idle: "var(--text-dim)",
  running: "var(--gold-strong)",
  passed: "var(--green)",
  failed: "var(--red)",
};

const activityTypeLabel: Record<ActivityLog["type"], string> = {
  task: "업무",
  agent: "agent",
  doc: "문서",
  check: "검증",
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

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "요청에 실패했다.");
  }
  return data as T;
}

function HoverGuide({ text }: { text: string }) {
  return (
    <span className="ops-guide" tabIndex={0} aria-label={text}>
      <Info className="h-3.5 w-3.5" />
      <span className="ops-guide-bubble">{text}</span>
    </span>
  );
}

function SectionHeader({
  title,
  description,
  guide,
  action,
}: {
  title: string;
  description: string;
  guide: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ops-section-head">
      <div>
        <div className="ops-title-row">
          <h2 className="ops-section-title">{title}</h2>
          <HoverGuide text={guide} />
        </div>
        <p className="ops-section-copy">{description}</p>
      </div>
      {action}
    </div>
  );
}

function FieldLabel({ title, guide }: { title: string; guide: string }) {
  return (
    <div className="ops-field-label">
      <span>{title}</span>
      <HoverGuide text={guide} />
    </div>
  );
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
    note: `${agent.name} 기본 지침과 예시 기준으로 생성한 업무 초안`,
    updatedAt: new Date().toISOString(),
  };
}

function emptyAgentExample(index: number): FootoryAgent["examples"][number] {
  return {
    label: `예시 ${index}`,
    goal: "",
    paths: "",
    done: "",
    verification: "npm run lint\nnpm run typecheck\nnpm run test:run",
  };
}

export default function FootoryCompanyClient() {
  const [panel, setPanel] = useState<PanelKey>("overview");
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [state, setState] = useState<CompanyState | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDocPath, setSelectedDocPath] = useState("");
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [agentDraft, setAgentDraft] = useState<FootoryAgent | null>(null);
  const [docDraft, setDocDraft] = useState<ManagedDocRecord | null>(null);
  const [docContent, setDocContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [runningCheck, setRunningCheck] = useState<CheckRun["script"] | null>(null);
  const [docOwnerFilter, setDocOwnerFilter] = useState("all");

  const selectedPanel = panels.find((item) => item.id === panel) ?? panels[0];

  const selectedAgent = useMemo(
    () => state?.agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [selectedAgentId, state?.agents]
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

  const activeAgentExample = useMemo(
    () => agentDraft?.examples?.[0] ?? null,
    [agentDraft]
  );

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

  const recentActivity = useMemo(
    () => (state?.activity ?? []).slice(0, 6),
    [state?.activity]
  );

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ overview: CompanyOverview; state: CompanyState }>("/api/company/overview");
      setOverview(data.overview);
      setState(data.state);
      setSelectedAgentId((current) => current || data.state.agents[0]?.id || "");
      setSelectedTaskId((current) => current || data.state.tasks[0]?.id || "");
      setSelectedDocPath((current) => current || data.state.docRegistry[0]?.path || "");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "운영 상태를 불러오지 못했다.");
    } finally {
      setLoading(false);
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
    setTaskDraft(emptyTask(selectedAgentId || state.agents[0]?.id || ""));
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
      await loadOverview();
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
      await loadOverview();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "업무 삭제에 실패했다.");
    } finally {
      setSaving(null);
    }
  };

  const saveAgent = async () => {
    if (!agentDraft) return;
    setSaving("agent");
    try {
      await fetchJson("/api/company/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "saveAgent", agent: agentDraft }),
      });
      setFeedback("담당자 기준을 저장했다.");
      await loadOverview();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "담당자 저장에 실패했다.");
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
      await loadOverview();
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
      await loadOverview();
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
      await loadOverview();
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

  const updateAgentExample = (
    index: number,
    key: keyof FootoryAgent["examples"][number],
    value: string
  ) => {
    if (!agentDraft) return;
    const nextExamples = agentDraft.examples.map((example, exampleIndex) =>
      exampleIndex === index ? { ...example, [key]: value } : example
    );
    setAgentDraft({ ...agentDraft, examples: nextExamples });
  };

  const addAgentExample = () => {
    if (!agentDraft) return;
    setAgentDraft({
      ...agentDraft,
      examples: [...agentDraft.examples, emptyAgentExample(agentDraft.examples.length + 1)],
    });
    setFeedback(`${agentDraft.name} 예시 칸을 추가했다.`);
  };

  const removeAgentExample = (index: number) => {
    if (!agentDraft || agentDraft.examples.length === 1) return;
    setAgentDraft({
      ...agentDraft,
      examples: agentDraft.examples.filter((_, exampleIndex) => exampleIndex !== index),
    });
    setFeedback(`${agentDraft.name} 예시 ${index + 1}을 제거했다.`);
  };

  const loadAgentExampleIntoTask = (example: FootoryAgent["examples"][number]) => {
    if (!agentDraft) return;
    setTaskDraft(buildTaskFromAgentExample(agentDraft, example));
    setSelectedTaskId("");
    setPanel("tasks");
    setFeedback(`${agentDraft.name} 예시를 업무 작성 화면으로 가져왔다.`);
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

  const agentGuideBrief = activeAgentExample && agentDraft
    ? buildAgentBrief(agentDraft, {
        goal: activeAgentExample.goal,
        paths: activeAgentExample.paths,
        done: activeAgentExample.done,
        verification: activeAgentExample.verification,
      })
    : "";

  const inProgressCount = state?.tasks.filter((task) => task.status === "in_progress").length ?? 0;
  const blockedCount = state?.tasks.filter((task) => task.status === "blocked").length ?? 0;
  const recentCheck = overview?.checks[0] ?? null;
  const primaryAlerts = overview?.alerts.slice(0, 3) ?? [];
  const focusDocs = overview?.focusDocs.slice(0, 4) ?? [];
  const dirtyFiles = overview?.git.files ?? [];

  if (loading || !state || !overview || !taskDraft || !agentDraft || !docDraft) {
    return (
      <div className="ops-shell">
        <div className="ops-loading ops-panel-strong">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>운영 화면을 불러오는 중이다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ops-shell">
      <header className="ops-hero ops-panel-strong">
        <div className="ops-hero-copy">
          <div className="ops-kicker">local only ops console</div>
          <h1 className="ops-display ops-hero-title">Footory 관리자 운영실</h1>
          <p className="ops-hero-text">
            상위 Footory 저장소와 직접 연결된 로컬 전용 콘솔이다. 무엇을 해야 하는지 먼저 보이고, 설명은 필요할 때만 hover로 확인한다.
          </p>
          <div className="ops-hero-tags" aria-label="운영 콘솔 핵심 특성">
            <span className="ops-hero-tag">로컬 접속만 허용</span>
            <span className="ops-hero-tag">루트 문서 직접 편집</span>
            <span className="ops-hero-tag">ops-state.json 상태 저장</span>
          </div>
        </div>
        <div className="ops-hero-stats">
          <div className="ops-stat-card">
            <span>진행 중 업무</span>
            <strong>{inProgressCount}</strong>
          </div>
          <div className="ops-stat-card">
            <span>막힌 업무</span>
            <strong>{blockedCount}</strong>
          </div>
          <div className="ops-stat-card">
            <span>긴급 경보</span>
            <strong>{overview.alerts.length}</strong>
          </div>
          <div className="ops-stat-card">
            <span>최근 점검</span>
            <strong>{recentCheck?.script ?? "없음"}</strong>
          </div>
        </div>
      </header>

      {feedback ? <div className="ops-feedback">{feedback}</div> : null}

      <div className="ops-layout">
        <aside className="ops-sidebar ops-panel">
          <div className="ops-sidebar-section">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">메뉴</h2>
              <HoverGuide text="먼저 할 일을 찾고 싶으면 현황, 지시를 만들려면 업무를 누르면 된다." />
            </div>
            <div className="ops-nav-list">
              {panels.map((item) => {
                const Icon = item.icon;
                const active = panel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ops-nav-card ${active ? "is-active" : ""}`}
                    onClick={() => setPanel(item.id)}
                  >
                    <div className="ops-nav-main">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="ops-nav-label">{item.label}</div>
                        <div className="ops-nav-caption">{item.caption}</div>
                      </div>
                    </div>
                    <HoverGuide text={item.guide} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ops-sidebar-section ops-soft-block">
            <div className="ops-title-row">
              <h3 className="ops-sidebar-title">지금 선택</h3>
              <HoverGuide text="현재 열려 있는 화면과 편집 대상을 보여준다." />
            </div>
            <ul className="ops-plain-list">
              <li>화면: {selectedPanel.label}</li>
              <li>업무: {taskDraft.title || "새 업무"}</li>
              <li>담당자: {agentDraft.name}</li>
              <li>문서: {docDraft.title}</li>
            </ul>
          </div>

          <div className="ops-sidebar-section ops-soft-block">
            <div className="ops-title-row">
              <h3 className="ops-sidebar-title">운영 원칙</h3>
              <HoverGuide text="관리자가 판단할 때 절대 잊지 말아야 하는 기준이다." />
            </div>
            <ul className="ops-rule-list">
              {companyCharter.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="ops-main ops-panel-strong">
          {panel === "overview" ? (
            <div className="ops-stack">
              <SectionHeader
                title="지금 먼저 볼 것"
                description="긴급 경보와 최근 검증만 먼저 보이게 압축했다. 나머지는 접어서 본다."
                guide="운영자가 가장 먼저 확인해야 하는 정보만 위로 올린 영역이다."
              />

              <section className="ops-panel-block ops-local-board">
                <div className="ops-card-head">
                  <span>로컬 연결</span>
                  <HoverGuide text="이 콘솔은 로컬 localhost에서만 열리며, 상위 Footory 저장소와 상태 파일을 직접 읽고 쓴다." />
                </div>
                <div className="ops-local-grid">
                  <div className="ops-local-card">
                    <strong>접속 범위</strong>
                    <p>{overview.workspace.allowedHosts.join(", ")}</p>
                  </div>
                  <div className="ops-local-card">
                    <strong>콘솔 앱 위치</strong>
                    <code>{overview.workspace.consolePath}</code>
                  </div>
                  <div className="ops-local-card">
                    <strong>운영 대상 저장소</strong>
                    <code>{overview.workspace.repoPath}</code>
                  </div>
                  <div className="ops-local-card">
                    <strong>상태 파일</strong>
                    <code>{overview.workspace.stateFilePath}</code>
                  </div>
                </div>
              </section>

              <div className="ops-alert-grid">
                <section className="ops-focus-card ops-warm-card">
                  <div className="ops-card-head">
                    <span>긴급 경보</span>
                    <HoverGuide text="blocker, release, validation 문서에서 추린 현재 핵심 메시지다." />
                  </div>
                  {primaryAlerts.length > 0 ? (
                    <ul className="ops-alert-list">
                      {primaryAlerts.map((alert) => (
                        <li key={alert}>
                          <TriangleAlert className="h-4 w-4" />
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ops-muted">지금 바로 뜬 긴급 경보는 없다.</p>
                  )}
                </section>

                <section className="ops-focus-card">
                  <div className="ops-card-head">
                    <span>최근 검증</span>
                    <HoverGuide text="가장 마지막에 실행한 lint, typecheck, test 결과를 보여준다." />
                  </div>
                  {recentCheck ? (
                    <div className="ops-check-summary">
                      <strong style={{ color: checkTone[recentCheck.status] }}>{recentCheck.summary}</strong>
                      <span>{recentCheck.script}</span>
                      <small>{formatTime(recentCheck.finishedAt ?? recentCheck.startedAt)}</small>
                    </div>
                  ) : (
                    <p className="ops-muted">아직 실행된 검증이 없다.</p>
                  )}
                </section>

                <section className="ops-focus-card">
                  <div className="ops-card-head">
                    <span>지금 볼 문서</span>
                    <HoverGuide text="운영 중 자주 다시 열어야 하는 문서를 우선 순위로 보여준다." />
                  </div>
                  <ul className="ops-mini-docs">
                    {focusDocs.map((doc) => (
                      <li key={doc.path}>
                        <button type="button" className="ops-doc-link" onClick={() => openDoc(doc.path)}>
                          <strong>{doc.title}</strong>
                          <span>{doc.path}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section className="ops-panel-block">
                <SectionHeader
                  title="점검 실행"
                  description="루트 Footory 저장소 기준으로 바로 검증을 돌린다."
                  guide="관리자 앱 자체가 아니라 운영 대상인 Footory 저장소에 대해 검증을 실행한다."
                />
                <div className="ops-action-row">
                  {(["lint", "typecheck", "test:run"] as CheckRun["script"][]).map((script) => (
                    <button
                      key={script}
                      type="button"
                      className="ops-action-card"
                      onClick={() => void runCheck(script)}
                      disabled={runningCheck === script}
                    >
                      {runningCheck === script ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                      <div>
                        <strong>{script}</strong>
                        <span>클릭하면 바로 실행</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <details className="ops-disclosure">
                <summary>상세 현황 보기</summary>
                <div className="ops-disclosure-body">
                  <div className="ops-detail-grid">
                    {overview.resources.map((resource) => (
                      <div key={resource.label} className="ops-detail-card">
                        <span>{resource.label}</span>
                        <strong>{resource.count}</strong>
                        <small>{resource.detail}</small>
                      </div>
                    ))}
                  </div>
                  <div className="ops-dirty-list">
                    {dirtyFiles.map((file) => (
                      <div key={`${file.status}-${file.path}`} className="ops-dirty-row">
                        <span>{file.status}</span>
                        <code>{file.path}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          ) : null}

          {panel === "tasks" ? (
            <div className="ops-editor-layout">
              <section className="ops-list-column">
                <SectionHeader
                  title="업무 목록"
                  description="먼저 existing 업무를 고르거나 새 업무를 만든다."
                  guide="왼쪽은 빠른 선택용이다. 길게 읽는 설명은 숨기고 제목, 상태, 담당자만 보여준다."
                  action={
                    <button
                      type="button"
                      className="ops-secondary-button"
                      onClick={() => {
                        setSelectedTaskId("");
                        setTaskDraft(emptyTask(selectedAgentId || state.agents[0]?.id || ""));
                      }}
                    >
                      새 업무
                    </button>
                  }
                />
                <div className="ops-list-stack">
                  {state.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={`ops-list-card ${selectedTaskId === task.id ? "is-active" : ""}`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="ops-list-top">
                        <strong>{task.title}</strong>
                        <span style={{ color: statusTone[task.status] }}>{statusLabel[task.status]}</span>
                      </div>
                      <div className="ops-list-meta">
                        <span>{priorityLabel[task.priority]}</span>
                        <span>{state.agents.find((agent) => agent.id === task.agentId)?.name ?? task.agentId}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="ops-form-column">
                <SectionHeader
                  title="업무 작성"
                  description="누구에게 무엇을 맡기는지 짧고 명확하게 적는다."
                  guide="업무 제목, 목표, 관련 파일, 완료 기준만 좋아도 대부분의 지시가 충분히 명확해진다."
                  action={
                    <button type="button" className="ops-secondary-button" onClick={() => void copyBrief()}>
                      <Copy className="h-4 w-4" />
                      {copied ? "복사됨" : "brief 복사"}
                    </button>
                  }
                />

                <div className="ops-form-grid two-up">
                  <label>
                    <FieldLabel title="업무 제목" guide="한 줄로 알아볼 수 있게 적는다." />
                    <input
                      className="ops-input"
                      value={taskDraft.title}
                      onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="담당 agent" guide="이 업무를 먼저 읽고 판단할 주체를 고른다." />
                    <select
                      className="ops-input"
                      value={taskDraft.agentId}
                      onChange={(event) => setTaskDraft({ ...taskDraft, agentId: event.target.value })}
                    >
                      {state.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <FieldLabel title="상태" guide="대기, 진행 중, 검토 중, 막힘, 완료 중 하나를 고른다." />
                    <select
                      className="ops-input"
                      value={taskDraft.status}
                      onChange={(event) => setTaskDraft({ ...taskDraft, status: event.target.value as CompanyTask["status"] })}
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <FieldLabel title="우선순위" guide="일정과 리스크 기준으로 urgency를 정한다." />
                    <select
                      className="ops-input"
                      value={taskDraft.priority}
                      onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as CompanyTask["priority"] })}
                    >
                      {Object.entries(priorityLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="ops-form-stack">
                  <label>
                    <FieldLabel title="목표" guide="이 업무가 끝났을 때 어떤 상태여야 하는지 한두 문장으로 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={taskDraft.goal}
                      onChange={(event) => setTaskDraft({ ...taskDraft, goal: event.target.value })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="관련 파일/경로" guide="agent가 바로 열어야 할 파일만 줄바꿈으로 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={4}
                      value={multiline(taskDraft.paths)}
                      onChange={(event) => setTaskDraft({ ...taskDraft, paths: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="근거 문서" guide="판단 기준이 되는 canonical 문서를 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(taskDraft.docs)}
                      onChange={(event) => setTaskDraft({ ...taskDraft, docs: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="하지 말 것" guide="범위 확장, 금지 방향, 위험한 수정 등을 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(taskDraft.constraints)}
                      onChange={(event) => setTaskDraft({ ...taskDraft, constraints: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="완료 기준" guide="완료 판정에 필요한 결과를 줄바꿈으로 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(taskDraft.doneCriteria)}
                      onChange={(event) => setTaskDraft({ ...taskDraft, doneCriteria: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="검증" guide="반드시 실행해야 하는 명령을 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(taskDraft.verification)}
                      onChange={(event) => setTaskDraft({ ...taskDraft, verification: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="운영 메모" guide="배경 메모가 필요할 때만 짧게 남긴다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={2}
                      value={taskDraft.note}
                      onChange={(event) => setTaskDraft({ ...taskDraft, note: event.target.value })}
                    />
                  </label>
                </div>

                <div className="ops-action-row">
                  <button type="button" className="ops-primary-button" onClick={() => void saveTask()} disabled={saving === "task"}>
                    {saving === "task" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    업무 저장
                  </button>
                  <button
                    type="button"
                    className="ops-danger-button"
                    onClick={() => void deleteTask()}
                    disabled={!taskDraft.id || saving === "delete-task"}
                  >
                    {saving === "delete-task" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    삭제
                  </button>
                </div>

                <section className="ops-brief-box">
                  <div className="ops-card-head">
                    <span>전달용 brief</span>
                    <HoverGuide text="복사해서 바로 agent에게 붙여 넣는 용도다." />
                  </div>
                  <pre>{activeBrief}</pre>
                </section>

                <section className="ops-soft-block ops-history-panel">
                  <div className="ops-card-head">
                    <span>업무 히스토리</span>
                    <HoverGuide text="이 업무 카드에 대해 최근에 저장, 수정, 삭제된 흐름을 시간순으로 보여준다." />
                  </div>
                  {taskDraft.id && selectedTaskLogs.length > 0 ? (
                    <div className="ops-history-list">
                      {selectedTaskLogs.map((entry) => (
                        <article key={entry.id} className="ops-history-card">
                          <div className="ops-history-top">
                            <span className="ops-history-kind">{activityTypeLabel[entry.type]}</span>
                            <small>{formatTime(entry.createdAt)}</small>
                          </div>
                          <strong>{entry.title}</strong>
                          <p>{entry.detail}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="ops-muted">아직 이 업무에 쌓인 히스토리가 없다.</p>
                  )}
                </section>
              </section>
            </div>
          ) : null}

          {panel === "agents" ? (
            <div className="ops-editor-layout">
              <section className="ops-list-column">
                <SectionHeader
                  title="담당자 목록"
                  description="누가 어떤 판단을 맡는지 빠르게 고른다."
                  guide="역할이 겹치지 않게 owner를 분명히 유지하는 것이 목적이다."
                />
                <div className="ops-list-stack">
                  {state.agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      className={`ops-list-card ${selectedAgentId === agent.id ? "is-active" : ""}`}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <div className="ops-list-top">
                        <strong>{agent.name}</strong>
                        <span>{agent.department}</span>
                      </div>
                      <div className="ops-list-meta">
                        <span>{agent.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="ops-form-column">
                <SectionHeader
                  title="담당자 기준"
                  description="이 agent를 언제 부르고, 어떻게 지시하고, 어떤 기준으로 막을지 한 화면에서 관리한다."
                  guide="역할 설명만이 아니라 실제 사용 예시와 지시 템플릿까지 함께 관리해야 처음 보는 관리자도 바로 쓸 수 있다."
                  action={
                    <div className="ops-inline-actions">
                      <button type="button" className="ops-secondary-button" onClick={addAgentExample}>
                        <Plus className="h-4 w-4" />
                        예시 추가
                      </button>
                      <button type="button" className="ops-primary-button" onClick={() => void saveAgent()} disabled={saving === "agent"}>
                        {saving === "agent" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        저장
                      </button>
                    </div>
                  }
                />

                <div className="ops-form-stack">
                  <section className="ops-soft-block ops-agent-guide">
                    <div className="ops-card-head">
                      <span>이 agent를 이렇게 쓴다</span>
                      <HoverGuide text="언제 호출하는지, 먼저 무엇을 적어야 하는지, 어떤 문서를 같이 줘야 하는지 정리한 영역이다." />
                    </div>
                    <div className="ops-guide-grid">
                      <div className="ops-guide-card">
                        <strong>언제 부르나</strong>
                        <p>{agentDraft.summary}</p>
                      </div>
                      <div className="ops-guide-card">
                        <strong>먼저 맡기기 좋은 일</strong>
                        <ul className="ops-plain-list compact">
                          {agentDraft.nextMoves.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="ops-guide-card">
                        <strong>같이 줘야 할 문서</strong>
                        <ul className="ops-plain-list compact ops-doc-link-list">
                          {agentDraft.sourceDocs.map((item) => (
                            <li key={item}>
                              <button type="button" className="ops-doc-link inline" onClick={() => openDoc(item)}>
                                <span>{item}</span>
                                <FolderOpen className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  <label>
                    <FieldLabel title="한 줄 설명" guide="관리자가 이 agent를 언제 불러야 하는지 바로 이해되게 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={2}
                      value={agentDraft.summary}
                      onChange={(event) => setAgentDraft({ ...agentDraft, summary: event.target.value })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="이 agent가 하는 일" guide="맡겨도 되는 업무를 줄바꿈으로 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={4}
                      value={multiline(agentDraft.canDo)}
                      onChange={(event) => setAgentDraft({ ...agentDraft, canDo: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="이 agent가 하지 않는 일" guide="경계가 모호해지지 않게 금지선을 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={4}
                      value={multiline(agentDraft.wontDo)}
                      onChange={(event) => setAgentDraft({ ...agentDraft, wontDo: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="다음에 맡기기 좋은 일" guide="관리자가 다음 요청을 어떤 agent에 줄지 판단하는 힌트다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(agentDraft.nextMoves)}
                      onChange={(event) => setAgentDraft({ ...agentDraft, nextMoves: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="red flag" guide="이 agent가 경고해야 하는 위험 신호다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(agentDraft.redFlags)}
                      onChange={(event) => setAgentDraft({ ...agentDraft, redFlags: lines(event.target.value) })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="근거 문서" guide="이 agent가 먼저 읽어야 할 기준 문서를 적는다." />
                    <textarea
                      className="ops-input ops-textarea"
                      rows={3}
                      value={multiline(agentDraft.sourceDocs)}
                      onChange={(event) => setAgentDraft({ ...agentDraft, sourceDocs: lines(event.target.value) })}
                    />
                  </label>

                  {agentDraft.examples.map((example, index) => (
                    <section key={`${agentDraft.id}-example-${index}`} className="ops-soft-block ops-agent-example">
                      <div className="ops-card-head">
                        <span>사용 예시 {index + 1}</span>
                        <div className="ops-inline-actions">
                          <button
                            type="button"
                            className="ops-danger-button"
                            onClick={() => removeAgentExample(index)}
                            disabled={agentDraft.examples.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                            예시 삭제
                          </button>
                          <button
                            type="button"
                            className="ops-secondary-button"
                            onClick={() => loadAgentExampleIntoTask(example)}
                          >
                            업무로 가져오기
                          </button>
                        </div>
                      </div>

                      <div className="ops-form-stack">
                        <label>
                          <FieldLabel title="예시 제목" guide="관리자가 예시를 구분하기 쉬운 짧은 이름을 적는다." />
                          <input
                            className="ops-input"
                            value={example.label}
                            onChange={(event) => updateAgentExample(index, "label", event.target.value)}
                          />
                        </label>
                        <label>
                          <FieldLabel title="예시 목표" guide="이 agent에게 맡길 실제 요청 한 문장을 적는다." />
                          <textarea
                            className="ops-input ops-textarea"
                            rows={2}
                            value={example.goal}
                            onChange={(event) => updateAgentExample(index, "goal", event.target.value)}
                          />
                        </label>
                        <label>
                          <FieldLabel title="예시 파일/경로" guide="실제로 같이 넘길 파일이나 경로를 줄바꿈으로 적는다." />
                          <textarea
                            className="ops-input ops-textarea"
                            rows={3}
                            value={example.paths}
                            onChange={(event) => updateAgentExample(index, "paths", event.target.value)}
                          />
                        </label>
                        <label>
                          <FieldLabel title="예시 완료 기준" guide="agent가 끝냈다고 볼 조건을 적는다." />
                          <textarea
                            className="ops-input ops-textarea"
                            rows={3}
                            value={example.done}
                            onChange={(event) => updateAgentExample(index, "done", event.target.value)}
                          />
                        </label>
                        <label>
                          <FieldLabel title="예시 검증" guide="이 요청에서 함께 요구할 검증 명령을 적는다." />
                          <textarea
                            className="ops-input ops-textarea"
                            rows={2}
                            value={example.verification}
                            onChange={(event) => updateAgentExample(index, "verification", event.target.value)}
                          />
                        </label>
                      </div>
                    </section>
                  ))}

                  <section className="ops-brief-box">
                    <div className="ops-card-head">
                      <span>agent 지시문 미리보기</span>
                      <HoverGuide text="현재 example 1 기준으로 이 agent에게 바로 보낼 수 있는 지시문 형태를 보여준다." />
                    </div>
                    <pre>{agentGuideBrief}</pre>
                  </section>

                  <section className="ops-soft-block ops-history-panel">
                    <div className="ops-card-head">
                      <span>최근 처리 로그</span>
                      <HoverGuide text="이 agent와 연결된 업무 저장, 문서 저장, 검증 실행 기록을 최근 순으로 보여준다." />
                    </div>
                    {selectedAgentLogs.length > 0 ? (
                      <div className="ops-history-list">
                        {selectedAgentLogs.map((entry) => (
                          <article key={entry.id} className="ops-history-card">
                            <div className="ops-history-top">
                              <span className="ops-history-kind">{activityTypeLabel[entry.type]}</span>
                              <small>{formatTime(entry.createdAt)}</small>
                            </div>
                            <strong>{entry.title}</strong>
                            <p>{entry.detail}</p>
                            {entry.docPath ? <code>{entry.docPath}</code> : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="ops-muted">아직 이 agent에 연결된 로그가 없다.</p>
                    )}
                  </section>
                </div>
              </section>
            </div>
          ) : null}

          {panel === "docs" ? (
            <div className="ops-editor-layout">
              <section className="ops-list-column">
                <SectionHeader
                  title="문서 목록"
                  description="먼저 owner와 목적을 확인할 문서를 고른다."
                  guide="문서는 제목보다 owner와 목적이 중요하다. 왜 존재하는지 먼저 보여준다."
                  action={
                    <select
                      className="ops-input ops-filter-select"
                      value={docOwnerFilter}
                      onChange={(event) => setDocOwnerFilter(event.target.value)}
                    >
                      <option value="all">모든 owner</option>
                      {state.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  }
                />
                <div className="ops-list-stack">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.path}
                      type="button"
                      className={`ops-list-card ${selectedDocPath === doc.path ? "is-active" : ""}`}
                      onClick={() => setSelectedDocPath(doc.path)}
                    >
                      <div className="ops-list-top">
                        <strong>{doc.title}</strong>
                        <span>{categoryLabel[doc.category]}</span>
                      </div>
                      <div className="ops-list-meta">
                        <span>{doc.purpose}</span>
                        <span>{state.agents.find((agent) => agent.id === doc.ownerAgentId)?.name ?? doc.ownerAgentId}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="ops-form-column">
                <SectionHeader
                  title="문서 편집"
                  description="메타 정보와 본문을 한 자리에서 수정한다."
                  guide="문서 방향을 바꾸는 것이 아니라 owner, 목적, 본문을 현재 구현 기준에 맞게 유지하는 용도다."
                />

                <div className="ops-form-grid two-up">
                  <label>
                    <FieldLabel title="문서 제목" guide="목록에서 바로 찾을 수 있는 이름이어야 한다." />
                    <input
                      className="ops-input"
                      value={docDraft.title}
                      onChange={(event) => setDocDraft({ ...docDraft, title: event.target.value })}
                    />
                  </label>
                  <label>
                    <FieldLabel title="카테고리" guide="핵심, 영상, 사용성, 검증, 운영 중 하나를 고른다." />
                    <select
                      className="ops-input"
                      value={docDraft.category}
                      onChange={(event) => setDocDraft({ ...docDraft, category: event.target.value as ManagedDocRecord["category"] })}
                    >
                      {Object.entries(categoryLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <FieldLabel title="owner agent" guide="이 문서를 먼저 책임질 agent를 정한다." />
                    <select
                      className="ops-input"
                      value={docDraft.ownerAgentId}
                      onChange={(event) => setDocDraft({ ...docDraft, ownerAgentId: event.target.value })}
                    >
                      {state.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <FieldLabel title="문서 목적" guide="왜 이 문서가 필요한지 짧게 적는다." />
                    <input
                      className="ops-input"
                      value={docDraft.purpose}
                      onChange={(event) => setDocDraft({ ...docDraft, purpose: event.target.value })}
                    />
                  </label>
                </div>

                <div className="ops-inline-note">현재 편집 대상: {docDraft.path}</div>

                <div className="ops-action-row">
                  <button type="button" className="ops-secondary-button" onClick={() => void saveDocMeta()} disabled={saving === "doc-meta"}>
                    {saving === "doc-meta" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    메타 저장
                  </button>
                </div>

                <label>
                  <FieldLabel title="문서 본문" guide="필요한 경우에만 수정한다. 저장하면 바로 루트 저장소 문서가 갱신된다." />
                  <textarea
                    className="ops-input ops-textarea ops-doc-editor"
                    rows={22}
                    value={docContent}
                    onChange={(event) => setDocContent(event.target.value)}
                  />
                </label>

                <div className="ops-action-row">
                  <button type="button" className="ops-primary-button" onClick={() => void saveDocContent()} disabled={saving === "doc-content"}>
                    {saving === "doc-content" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    본문 저장
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </main>

        <aside className="ops-guide-rail ops-panel">
          <section className="ops-rail-block">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">사용 가이드</h2>
              <HoverGuide text="처음 보는 관리자도 순서대로 따라오게 하는 짧은 안내다." />
            </div>
            <ol className="ops-step-list">
              {panelHowTo[panel].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="ops-rail-block ops-soft-block">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">항상 지킬 것</h2>
              <HoverGuide text="화면을 단순화해도 이 기준은 바뀌지 않는다." />
            </div>
            <ul className="ops-plain-list compact">
              {operatingRules.slice(0, 4).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <section className="ops-rail-block ops-soft-block">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">최근 검증 로그</h2>
              <HoverGuide text="가장 최근에 실행한 검증 결과만 먼저 보여준다." />
            </div>
            {overview.checks.length > 0 ? (
              <div className="ops-check-list">
                {overview.checks.slice(0, 4).map((check) => (
                  <div key={check.id} className="ops-check-card">
                    <div className="ops-list-top">
                      <strong>{check.script}</strong>
                      <span style={{ color: checkTone[check.status] }}>{check.summary}</span>
                    </div>
                    <small>{formatTime(check.finishedAt ?? check.startedAt)}</small>
                    <code>{check.output}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ops-muted">아직 실행된 검증이 없다.</p>
            )}
          </section>

          <section className="ops-rail-block ops-soft-block">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">최근 운영 로그</h2>
              <HoverGuide text="업무 저장, agent 수정, 문서 저장, 검증 실행을 최근 순으로 짧게 보여준다." />
            </div>
            {recentActivity.length > 0 ? (
              <div className="ops-history-list compact">
                {recentActivity.map((entry) => (
                  <article key={entry.id} className="ops-history-card compact">
                    <div className="ops-history-top">
                      <span className="ops-history-kind">{activityTypeLabel[entry.type]}</span>
                      <small>{formatTime(entry.createdAt)}</small>
                    </div>
                    <strong>{entry.title}</strong>
                    <p>{entry.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="ops-muted">아직 쌓인 운영 로그가 없다.</p>
            )}
          </section>

          <section className="ops-rail-block ops-soft-block">
            <div className="ops-title-row">
              <h2 className="ops-sidebar-title">오늘 바로 볼 것</h2>
              <HoverGuide text="운영 중 자주 다시 여는 문서를 빠르게 모아둔 영역이다." />
            </div>
            <div className="ops-mini-docs">
              {focusDocs.map((doc) => (
                <button
                  key={doc.path}
                  type="button"
                  className="ops-mini-doc-card ops-doc-link"
                  onClick={() => openDoc(doc.path)}
                >
                  <strong>{doc.title}</strong>
                  <span>{doc.path}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
