import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  footoryAgents,
  getAgent,
  type FootoryAgent,
} from "./ops";
import {
  companyActivitySeed,
  companyStateSeed,
  managedDocsSeed,
  type ActivityLog,
  type CompanyOverview,
  type CheckRun,
  type CompanyState,
  type CompanyTask,
  type EditableAgent,
  type GitFileStatus,
  type ManagedDocRecord,
} from "./state";

const execFileAsync = promisify(execFile);
const consoleRoot = process.cwd();
const repoRoot = path.resolve(consoleRoot, "..");
const companyDataDir = path.join(consoleRoot, "company-data");
const companyStateFile = path.join(companyDataDir, "ops-state.json");
const allowedHosts = ["localhost", "127.0.0.1", "::1", "0.0.0.0"] as const;

const managedDocPaths = new Set(managedDocsSeed.map((item) => item.path));
const baselineScripts = new Set(["lint", "typecheck", "test:run"]);

function truncate(text: string, max = 1200): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n...`;
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => `${item}`.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeAgent(candidate: Partial<EditableAgent>, fallback: FootoryAgent): EditableAgent {
  return {
    ...fallback,
    ...candidate,
    canDo: parseList(candidate.canDo ?? fallback.canDo),
    wontDo: parseList(candidate.wontDo ?? fallback.wontDo),
    recentWork: parseList(candidate.recentWork ?? fallback.recentWork),
    nextMoves: parseList(candidate.nextMoves ?? fallback.nextMoves),
    redFlags: parseList(candidate.redFlags ?? fallback.redFlags),
    sourceDocs: parseList(candidate.sourceDocs ?? fallback.sourceDocs),
    examples: Array.isArray(candidate.examples) && candidate.examples.length > 0
      ? candidate.examples.map((example, index) => ({
          label: typeof example?.label === "string" ? example.label : `예시 ${index + 1}`,
          goal: typeof example?.goal === "string" ? example.goal : "",
          paths: typeof example?.paths === "string" ? example.paths : "",
          done: typeof example?.done === "string" ? example.done : "",
          verification: typeof example?.verification === "string" ? example.verification : "",
        }))
      : fallback.examples,
  };
}

function normalizeTask(candidate: Partial<CompanyTask>, fallbackId?: string): CompanyTask {
  const now = new Date().toISOString();

  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : fallbackId ?? `task-${Date.now()}`,
    title: typeof candidate.title === "string" ? candidate.title.trim() : "",
    agentId: typeof candidate.agentId === "string" && candidate.agentId.trim() ? candidate.agentId : footoryAgents[0].id,
    status: (candidate.status as CompanyTask["status"]) ?? "queued",
    priority: (candidate.priority as CompanyTask["priority"]) ?? "normal",
    goal: typeof candidate.goal === "string" ? candidate.goal.trim() : "",
    paths: parseList(candidate.paths),
    docs: parseList(candidate.docs),
    constraints: parseList(candidate.constraints),
    doneCriteria: parseList(candidate.doneCriteria),
    verification: parseList(candidate.verification),
    note: typeof candidate.note === "string" ? candidate.note.trim() : "",
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
  };
}

function normalizeDoc(candidate: Partial<ManagedDocRecord>, fallback: ManagedDocRecord): ManagedDocRecord {
  return {
    path: fallback.path,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : fallback.title,
    category: (candidate.category as ManagedDocRecord["category"]) ?? fallback.category,
    ownerAgentId: typeof candidate.ownerAgentId === "string" && candidate.ownerAgentId.trim()
      ? candidate.ownerAgentId
      : fallback.ownerAgentId,
    purpose: typeof candidate.purpose === "string" ? candidate.purpose : fallback.purpose,
    editable: typeof candidate.editable === "boolean" ? candidate.editable : fallback.editable,
  };
}

function normalizeCheck(candidate: Partial<CheckRun>): CheckRun {
  return {
    id: typeof candidate.id === "string" ? candidate.id : `check-${Date.now()}`,
    script: (candidate.script as CheckRun["script"]) ?? "lint",
    status: (candidate.status as CheckRun["status"]) ?? "idle",
    exitCode: typeof candidate.exitCode === "number" ? candidate.exitCode : null,
    summary: typeof candidate.summary === "string" ? candidate.summary : "",
    output: typeof candidate.output === "string" ? candidate.output : "",
    startedAt: typeof candidate.startedAt === "string" ? candidate.startedAt : new Date().toISOString(),
    finishedAt: typeof candidate.finishedAt === "string" ? candidate.finishedAt : null,
  };
}

function normalizeActivity(candidate: Partial<ActivityLog>): ActivityLog {
  return {
    id: typeof candidate.id === "string" ? candidate.id : `activity-${Date.now()}`,
    type: (candidate.type as ActivityLog["type"]) ?? "task",
    title: typeof candidate.title === "string" ? candidate.title : "",
    detail: typeof candidate.detail === "string" ? candidate.detail : "",
    agentId: typeof candidate.agentId === "string" ? candidate.agentId : null,
    taskId: typeof candidate.taskId === "string" ? candidate.taskId : null,
    docPath: typeof candidate.docPath === "string" ? candidate.docPath : null,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
  };
}

function makeActivityLog(input: Omit<ActivityLog, "id" | "createdAt">): ActivityLog {
  return {
    ...input,
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}

function appendActivity(current: CompanyState, entry: ActivityLog): CompanyState {
  return {
    ...current,
    activity: [entry, ...(current.activity ?? [])].slice(0, 80),
  };
}

async function ensureCompanyDir() {
  await fs.mkdir(companyDataDir, { recursive: true });
}

export async function readCompanyState(): Promise<CompanyState> {
  try {
    const raw = await fs.readFile(companyStateFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<CompanyState>;

    const agents = footoryAgents.map((agent) => {
      const candidate = parsed.agents?.find((item) => item.id === agent.id);
      return normalizeAgent(candidate ?? {}, agent);
    });

    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((task) => normalizeTask(task))
      : companyStateSeed.tasks;

    const docRegistry = managedDocsSeed.map((doc) => {
      const candidate = parsed.docRegistry?.find((item) => item.path === doc.path);
      return normalizeDoc(candidate ?? {}, doc);
    });

    const checks = Array.isArray(parsed.checks)
      ? parsed.checks.map((check) => normalizeCheck(check))
      : [];

    const activity = Array.isArray(parsed.activity)
      ? parsed.activity.map((entry) => normalizeActivity(entry))
      : companyActivitySeed;

    return { agents, tasks, docRegistry, checks, activity };
  } catch {
    return {
      agents: companyStateSeed.agents.map((agent) => ({ ...agent })),
      tasks: companyStateSeed.tasks.map((task) => ({ ...task })),
      docRegistry: companyStateSeed.docRegistry.map((doc) => ({ ...doc })),
      checks: [],
      activity: companyStateSeed.activity.map((entry) => ({ ...entry })),
    };
  }
}

export async function writeCompanyState(state: CompanyState) {
  await ensureCompanyDir();
  await fs.writeFile(companyStateFile, JSON.stringify(state, null, 2), "utf8");
}

export async function saveAgent(agent: Partial<EditableAgent>) {
  const current = await readCompanyState();
  const base = getAgent(agent.id ?? "");
  const normalized = normalizeAgent(agent, base);
  const agents = current.agents.map((item) => (item.id === normalized.id ? normalized : item));
  const nextState = appendActivity(
    { ...current, agents },
    makeActivityLog({
      type: "agent",
      title: `${normalized.name} 지침 저장`,
      detail: "agent 역할, 금지선, 예시 지시문 변경을 저장했다.",
      agentId: normalized.id,
      taskId: null,
      docPath: null,
    })
  );

  await writeCompanyState(nextState);
  return agents;
}

export async function saveTask(task: Partial<CompanyTask>) {
  const current = await readCompanyState();
  const normalized = normalizeTask({ ...task, updatedAt: new Date().toISOString() });
  const existingIndex = current.tasks.findIndex((item) => item.id === normalized.id);
  const tasks = [...current.tasks];
  const isUpdate = existingIndex >= 0;

  if (isUpdate) {
    tasks[existingIndex] = normalized;
  } else {
    tasks.unshift(normalized);
  }

  const nextState = appendActivity(
    { ...current, tasks },
    makeActivityLog({
      type: "task",
      title: isUpdate ? `업무 업데이트: ${normalized.title || normalized.id}` : `업무 생성: ${normalized.title || normalized.id}`,
      detail: `${normalized.agentId} 담당 업무의 목표, 경로, 완료 기준이 저장됐다.`,
      agentId: normalized.agentId,
      taskId: normalized.id,
      docPath: normalized.docs[0] ?? null,
    })
  );

  await writeCompanyState(nextState);
  return tasks;
}

export async function deleteTask(taskId: string) {
  const current = await readCompanyState();
  const target = current.tasks.find((item) => item.id === taskId);
  const tasks = current.tasks.filter((item) => item.id !== taskId);
  const nextState = appendActivity(
    { ...current, tasks },
    makeActivityLog({
      type: "task",
      title: `업무 삭제: ${target?.title ?? taskId}`,
      detail: "업무 카드가 운영 보드에서 제거됐다.",
      agentId: target?.agentId ?? null,
      taskId,
      docPath: target?.docs[0] ?? null,
    })
  );

  await writeCompanyState(nextState);
  return tasks;
}

export async function saveDocMeta(doc: Partial<ManagedDocRecord> & { path: string }) {
  if (!managedDocPaths.has(doc.path)) {
    throw new Error("관리 대상 문서가 아닙니다.");
  }

  const current = await readCompanyState();
  const base = managedDocsSeed.find((item) => item.path === doc.path);
  if (!base) throw new Error("문서 기준값을 찾을 수 없습니다.");

  const normalized = normalizeDoc(doc, base);
  const docRegistry = current.docRegistry.map((item) => (item.path === doc.path ? normalized : item));
  const nextState = appendActivity(
    { ...current, docRegistry },
    makeActivityLog({
      type: "doc",
      title: `문서 메타 저장: ${normalized.title}`,
      detail: "owner, 카테고리 또는 목적 변경을 저장했다.",
      agentId: normalized.ownerAgentId,
      taskId: null,
      docPath: normalized.path,
    })
  );

  await writeCompanyState(nextState);
  return docRegistry;
}

function resolveManagedDoc(docPath: string): string {
  if (!managedDocPaths.has(docPath)) {
    throw new Error("허용되지 않은 문서 경로입니다.");
  }

  return path.join(repoRoot, docPath);
}

export async function readManagedDoc(docPath: string) {
  const absolutePath = resolveManagedDoc(docPath);
  const content = await fs.readFile(absolutePath, "utf8");
  const registry = managedDocsSeed.find((item) => item.path === docPath);

  return {
    path: docPath,
    content,
    title: registry?.title ?? path.basename(docPath),
  };
}

export async function saveManagedDoc(docPath: string, content: string) {
  const absolutePath = resolveManagedDoc(docPath);
  await fs.writeFile(absolutePath, content, "utf8");
  const current = await readCompanyState();
  const doc = current.docRegistry.find((item) => item.path === docPath);
  const nextState = appendActivity(
    current,
    makeActivityLog({
      type: "doc",
      title: `문서 본문 저장: ${doc?.title ?? docPath}`,
      detail: "문서 본문이 루트 저장소 실제 파일에 반영됐다.",
      agentId: doc?.ownerAgentId ?? null,
      taskId: null,
      docPath,
    })
  );
  await writeCompanyState(nextState);
  return readManagedDoc(docPath);
}

async function countFiles(relativeDir: string, predicate: (entryPath: string) => boolean): Promise<number> {
  const target = path.join(repoRoot, relativeDir);

  async function walk(currentDir: string): Promise<number> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    let count = 0;

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        count += await walk(fullPath);
      } else {
        const relative = path.relative(repoRoot, fullPath).replaceAll(path.sep, "/");
        if (predicate(relative)) count += 1;
      }
    }

    return count;
  }

  try {
    return await walk(target);
  } catch {
    return 0;
  }
}

async function readDocExcerpt(docPath: string): Promise<string> {
  try {
    const content = await fs.readFile(path.join(repoRoot, docPath), "utf8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    return truncate(lines.slice(0, 2).join(" "), 180);
  } catch {
    return "문서를 읽지 못했다.";
  }
}

async function readBulletHighlights(docPath: string, limit = 4): Promise<string[]> {
  try {
    const content = await fs.readFile(path.join(repoRoot, docPath), "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .slice(0, limit)
      .map((line) => line.slice(2));
  } catch {
    return [];
  }
}

async function getGitStatus(): Promise<GitFileStatus[]> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short"], {
      cwd: repoRoot,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    return stdout
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim() || "??",
        path: line.slice(3).trim(),
      }));
  } catch {
    return [];
  }
}

export async function getCompanyOverview(): Promise<CompanyOverview> {
  const state = await readCompanyState();
  const [pages, apiRoutes, components, tests, libraries, gitFiles, shipBlockers, releaseNotes, validationNotes] = await Promise.all([
    countFiles("src/app", (entryPath) => entryPath.endsWith("/page.tsx")),
    countFiles("src/app/api", (entryPath) => entryPath.endsWith("/route.ts")),
    countFiles("src/components", (entryPath) => entryPath.endsWith(".tsx")),
    Promise.all([
      countFiles("src/__tests__", (entryPath) => entryPath.endsWith(".test.ts") || entryPath.endsWith(".test.tsx")),
      countFiles("tests/e2e", (entryPath) => entryPath.endsWith(".spec.ts")),
    ]).then(([unit, e2e]) => unit + e2e),
    countFiles("src/lib", (entryPath) => entryPath.endsWith(".ts") || entryPath.endsWith(".tsx")),
    getGitStatus(),
    readBulletHighlights("docs/ship-blockers.md", 3),
    readBulletHighlights("docs/release-readiness.md", 3),
    readBulletHighlights("docs/testing/video-validation-report.md", 3),
  ]);

  const focusDocs = await Promise.all(
    state.docRegistry.slice(0, 6).map(async (doc) => ({
      title: doc.title,
      path: doc.path,
      ownerAgentId: doc.ownerAgentId,
      excerpt: await readDocExcerpt(doc.path),
    }))
  );

  const alerts = [
    ...(gitFiles.length > 0 ? [`현재 dirty 파일 ${gitFiles.length}개`] : []),
    ...shipBlockers.map((item) => `Blocker: ${item}`),
    ...releaseNotes.map((item) => `Release: ${item}`),
    ...validationNotes.map((item) => `Validation: ${item}`),
  ].slice(0, 10);

  return {
    metrics: {
      docs: state.docRegistry.length,
      pages,
      apiRoutes,
      components,
      tests,
      libraries,
      dirtyFiles: gitFiles.length,
    },
    git: {
      dirty: gitFiles.length > 0,
      files: gitFiles.slice(0, 40),
    },
    resources: [
      { label: "문서", count: state.docRegistry.length, detail: "canonical + 운영 문서" },
      { label: "페이지", count: pages, detail: "src/app/**/page.tsx" },
      { label: "API", count: apiRoutes, detail: "src/app/api/**/route.ts" },
      { label: "컴포넌트", count: components, detail: "src/components/**/*.tsx" },
      { label: "테스트", count: tests, detail: "unit + e2e spec" },
      { label: "라이브러리", count: libraries, detail: "src/lib/**/*.ts(x)" },
    ],
    focusDocs,
    alerts,
    checks: state.checks.slice(0, 6),
    workspace: {
      consolePath: consoleRoot,
      repoPath: repoRoot,
      stateFilePath: companyStateFile,
      allowedHosts: [...allowedHosts],
    },
  };
}

export async function runVerificationScript(script: CheckRun["script"]): Promise<CheckRun> {
  if (!baselineScripts.has(script)) {
    throw new Error("허용되지 않은 검증 스크립트입니다.");
  }

  const startedAt = new Date().toISOString();
  let status: CheckRun["status"] = "passed";
  let exitCode: number | null = 0;
  let output = "";

  try {
    const { stdout, stderr } = await execFileAsync("npm", ["run", script], {
      cwd: repoRoot,
      timeout: 120_000,
      maxBuffer: 1024 * 1024 * 4,
      env: process.env,
    });
    output = truncate(`${stdout}\n${stderr}`.trim(), 16_000);
  } catch (error) {
    status = "failed";
    const failure = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
      message?: string;
    };
    exitCode = typeof failure.code === "number" ? failure.code : 1;
    output = truncate(`${failure.stdout ?? ""}\n${failure.stderr ?? ""}\n${failure.message ?? ""}`.trim(), 16_000);
  }

  const finishedAt = new Date().toISOString();
  const run: CheckRun = {
    id: `check-${script}-${Date.now()}`,
    script,
    status,
    exitCode,
    summary: status === "passed" ? `${script} 통과` : `${script} 실패`,
    output,
    startedAt,
    finishedAt,
  };

  const current = await readCompanyState();
  const checks = [run, ...current.checks].slice(0, 20);
  const nextState = appendActivity(
    { ...current, checks },
    makeActivityLog({
      type: "check",
      title: `검증 실행: ${script}`,
      detail: run.summary,
      agentId: "qa-release-auditor",
      taskId: null,
      docPath: "docs/testing/video-validation-report.md",
    })
  );

  await writeCompanyState(nextState);

  return run;
}
