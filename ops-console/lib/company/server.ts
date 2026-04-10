import { execFile } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { AutomationCatalog } from "./automation";
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
  type CompanyAlert,
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
const automationRegistryFile = path.join(repoRoot, ".agents", "footory-automation.json");
const automationMarketplaceFile = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
const automationPluginRoot = path.join(repoRoot, "plugins");
const allowedHosts = ["localhost", "127.0.0.1", "::1", "0.0.0.0"] as const;

const managedDocPaths = new Set(managedDocsSeed.map((item) => item.path));
const baselineScripts = new Set(["lint", "typecheck", "test:run"]);
const agentIds = new Set(footoryAgents.map((agent) => agent.id));

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

function normalizeAutomationCatalog(candidate: Partial<AutomationCatalog>): AutomationCatalog {
  return {
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
    agents: Array.isArray(candidate.agents) ? candidate.agents.map((agent) => ({
      id: typeof agent?.id === "string" ? agent.id : "",
      name: typeof agent?.name === "string" ? agent.name : "",
      title: typeof agent?.title === "string" ? agent.title : "",
      tier: agent?.tier === "optional" ? "optional" : "core",
      summary: typeof agent?.summary === "string" ? agent.summary : "",
      responsibilities: parseList(agent?.responsibilities),
      mustRead: parseList(agent?.mustRead),
      mustNot: parseList(agent?.mustNot),
      typicalPrompts: parseList(agent?.typicalPrompts),
      promptPath: typeof agent?.promptPath === "string" ? agent.promptPath : "",
    })) : [],
    skills: Array.isArray(candidate.skills) ? candidate.skills.map((skill) => ({
      id: typeof skill?.id === "string" ? skill.id : "",
      name: typeof skill?.name === "string" ? skill.name : "",
      pluginId: typeof skill?.pluginId === "string" ? skill.pluginId : "",
      summary: typeof skill?.summary === "string" ? skill.summary : "",
      skillPath: typeof skill?.skillPath === "string" ? skill.skillPath : "",
      whenToUse: parseList(skill?.whenToUse),
      outputs: parseList(skill?.outputs),
      defaultPrompt: typeof skill?.defaultPrompt === "string" ? skill.defaultPrompt : "",
    })) : [],
    plugins: Array.isArray(candidate.plugins) ? candidate.plugins.map((plugin) => ({
      id: typeof plugin?.id === "string" ? plugin.id : "",
      displayName: typeof plugin?.displayName === "string" ? plugin.displayName : "",
      summary: typeof plugin?.summary === "string" ? plugin.summary : "",
      pluginPath: typeof plugin?.pluginPath === "string" ? plugin.pluginPath : "",
      marketplacePath: typeof plugin?.marketplacePath === "string" ? plugin.marketplacePath : "",
      skillIds: parseList(plugin?.skillIds),
      agentRegistryPath: typeof plugin?.agentRegistryPath === "string" ? plugin.agentRegistryPath : "",
      commands: parseList(plugin?.commands),
    })) : [],
  };
}

export async function readAutomationCatalog(): Promise<AutomationCatalog> {
  try {
    const raw = await fs.readFile(automationRegistryFile, "utf8");
    return normalizeAutomationCatalog(JSON.parse(raw) as Partial<AutomationCatalog>);
  } catch {
    return {
      updatedAt: "",
      agents: [],
      skills: [],
      plugins: [],
    };
  }
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
  const agentId = typeof candidate.agentId === "string" && agentIds.has(candidate.agentId)
    ? candidate.agentId
    : footoryAgents[0].id;

  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : fallbackId ?? `task-${Date.now()}`,
    title: typeof candidate.title === "string" ? candidate.title.trim() : "",
    agentId,
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
      && agentIds.has(candidate.ownerAgentId)
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

async function readSectionBulletHighlights(docPath: string, sectionHeading: string, limit = 4): Promise<string[]> {
  try {
    const content = await fs.readFile(path.join(repoRoot, docPath), "utf8");
    const lines = content.split("\n");
    const headingIndex = lines.findIndex((line) => line.trim() === sectionHeading.trim());
    if (headingIndex === -1) {
      return [];
    }

    const items: string[] = [];
    for (let index = headingIndex + 1; index < lines.length; index += 1) {
      const trimmed = lines[index].trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("##") || trimmed.startsWith("###")) break;
      if (!trimmed.startsWith("- ")) continue;
      const item = trimmed.slice(2).trim();
      if (!item || item === "현재 없음") continue;
      items.push(item);
      if (items.length >= limit) break;
    }

    return items;
  } catch {
    return [];
  }
}

function buildDocAlerts(
  items: string[],
  config: {
    kind: Exclude<CompanyAlert["kind"], "dirty">;
    label: string;
    sourcePath: string;
    sourceLabel: string;
    actionLabel: string;
    meaning: string;
    nextStep: string;
  }
): CompanyAlert[] {
  return items.map((item, index) => ({
    id: `${config.kind}-${index}-${createHash("sha1").update(`${config.sourcePath}:${item}`).digest("hex").slice(0, 8)}`,
    kind: config.kind,
    label: config.label,
    summary: item,
    sourcePath: config.sourcePath,
    sourceLabel: config.sourceLabel,
    actionLabel: config.actionLabel,
    meaning: config.meaning,
    nextStep: config.nextStep,
    detailLines: [item],
    editable: true,
  }));
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

type InfraService = CompanyOverview["infraUsage"]["services"][number];

let localEnvCache: Record<string, string> | null = null;

function parseDotEnv(text: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) parsed[key] = value;
  }

  return parsed;
}

async function readLocalEnv(): Promise<Record<string, string>> {
  if (localEnvCache) return localEnvCache;

  const merged: Record<string, string> = {};
  for (const fileName of [".env.local", ".dev.vars"]) {
    try {
      const raw = await fs.readFile(path.join(repoRoot, fileName), "utf8");
      Object.assign(merged, parseDotEnv(raw));
    } catch {
      // optional file
    }
  }

  localEnvCache = merged;
  return merged;
}

async function getEnvValue(...keys: string[]): Promise<string | null> {
  const local = await readLocalEnv();
  for (const key of keys) {
    const fromRuntime = process.env[key];
    if (typeof fromRuntime === "string" && fromRuntime.trim()) return fromRuntime.trim();

    const fromFile = local[key];
    if (typeof fromFile === "string" && fromFile.trim()) return fromFile.trim();
  }

  return null;
}

function bytesToHuman(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatKoreanDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function withTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function parseContentRangeCount(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const match = contentRange.match(/\/(\d+)\s*$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchSupabaseUsage(): Promise<InfraService> {
  const supabaseUrl = await getEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = await getEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      id: "supabase",
      label: "Supabase",
      status: "missing",
      summary: "키가 없어 조회하지 못함",
      metrics: [],
      notes: ["필수 키: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"],
    };
  }

  const metrics: Array<{ label: string; value: string }> = [];
  const notes: string[] = [];
  let partial = false;

  try {
    const host = new URL(supabaseUrl).hostname;
    const projectRef = host.split(".")[0] ?? "";
    metrics.push({ label: "프로젝트", value: projectRef || host });
  } catch {
    notes.push("NEXT_PUBLIC_SUPABASE_URL 형식을 확인해야 한다.");
    partial = true;
  }

  const baseHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  const tables = ["profiles", "clips", "highlights", "video_projects"];
  let knownTableCount = 0;
  let totalRows = 0;
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          ...baseHeaders,
          Prefer: "count=exact",
        },
        signal: withTimeoutSignal(8_000),
      });

      if (response.status === 404) continue;
      if (!response.ok) {
        partial = true;
        notes.push(`${table} row 수 조회 실패 (${response.status})`);
        continue;
      }

      const count = parseContentRangeCount(response.headers.get("content-range"));
      if (typeof count === "number") {
        knownTableCount += 1;
        totalRows += count;
      }
    } catch {
      partial = true;
      notes.push(`${table} row 수 조회 실패`);
    }
  }

  metrics.push({ label: "확인 테이블", value: `${knownTableCount}/${tables.length}` });
  metrics.push({ label: "합계 row", value: `${totalRows.toLocaleString("en-US")}` });

  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: baseHeaders,
      signal: withTimeoutSignal(8_000),
    });
    if (response.ok) {
      const buckets = (await response.json()) as Array<{ id?: string; public?: boolean }>;
      const publicCount = buckets.filter((bucket) => bucket.public).length;
      metrics.push({ label: "스토리지 버킷", value: `${buckets.length}` });
      metrics.push({ label: "공개 버킷", value: `${publicCount}` });
    } else {
      partial = true;
      notes.push(`스토리지 버킷 조회 실패 (${response.status})`);
    }
  } catch {
    partial = true;
    notes.push("스토리지 버킷 조회 실패");
  }

  return {
    id: "supabase",
    label: "Supabase",
    status: partial ? "partial" : "ok",
    summary: partial ? "일부 사용량만 조회됨" : "연결됨",
    metrics,
    notes,
  };
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function signAwsV4Key(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function parseXmlTag(source: string, tag: string): string | null {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1] ?? null;
}

function parseR2SizesFromXml(xml: string): { objectCount: number; totalBytes: number } {
  const matches = [...xml.matchAll(/<Contents>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g)];
  return matches.reduce(
    (acc, match) => {
      const size = Number(match[1] ?? 0);
      return {
        objectCount: acc.objectCount + 1,
        totalBytes: acc.totalBytes + (Number.isFinite(size) ? size : 0),
      };
    },
    { objectCount: 0, totalBytes: 0 }
  );
}

async function fetchR2Usage(): Promise<InfraService> {
  const accountId = await getEnvValue("CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
  const accessKeyId = await getEnvValue("R2_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const secretAccessKey = await getEnvValue("R2_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY");
  const bucketName = await getEnvValue("R2_BUCKET_NAME");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return {
      id: "r2",
      label: "Cloudflare R2",
      status: "missing",
      summary: "키가 없어 조회하지 못함",
      metrics: [],
      notes: ["필수 키: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"],
    };
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${bucketName}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const payloadHash = sha256Hex("");

  let continuationToken = "";
  let totalBytes = 0;
  let totalObjects = 0;
  let pageCount = 0;
  let truncated = false;

  while (pageCount < 20) {
    const query = new URLSearchParams({ "list-type": "2", "max-keys": "1000" });
    if (continuationToken) query.set("continuation-token", continuationToken);
    const canonicalQueryString = query.toString();

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const canonicalRequest = [
      "GET",
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");
    const signingKey = signAwsV4Key(secretAccessKey, dateStamp, region, service);
    const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${host}${canonicalUri}?${canonicalQueryString}`, {
      headers: {
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authorizationHeader,
      },
      signal: withTimeoutSignal(10_000),
    });

    if (!response.ok) {
      return {
        id: "r2",
        label: "Cloudflare R2",
        status: "error",
        summary: "사용량 조회 실패",
        metrics: [{ label: "버킷", value: bucketName }],
        notes: [`S3 API 응답 코드: ${response.status}`],
      };
    }

    const xml = await response.text();
    const parsed = parseR2SizesFromXml(xml);
    totalObjects += parsed.objectCount;
    totalBytes += parsed.totalBytes;
    pageCount += 1;

    const isTruncated = parseXmlTag(xml, "IsTruncated") === "true";
    const nextToken = parseXmlTag(xml, "NextContinuationToken");
    if (isTruncated && nextToken) {
      continuationToken = nextToken;
      truncated = true;
      continue;
    }

    truncated = false;
    break;
  }

  return {
    id: "r2",
    label: "Cloudflare R2",
    status: truncated ? "partial" : "ok",
    summary: truncated ? "일부 사용량만 조회됨" : "연결됨",
    metrics: [
      { label: "버킷", value: bucketName },
      { label: "오브젝트", value: totalObjects.toLocaleString("en-US") },
      { label: "저장 용량", value: bytesToHuman(totalBytes) },
    ],
    notes: truncated ? ["페이지 제한(20)으로 전체 스캔이 중단됐다."] : [],
  };
}

async function readVercelProjectLink(): Promise<{ projectId: string | null; teamId: string | null; projectName: string | null }> {
  const fromEnvProjectId = await getEnvValue("VERCEL_PROJECT_ID");
  const fromEnvTeamId = await getEnvValue("VERCEL_TEAM_ID", "VERCEL_ORG_ID");
  const fromEnvProjectName = await getEnvValue("VERCEL_PROJECT_NAME");
  if (fromEnvProjectId) {
    return { projectId: fromEnvProjectId, teamId: fromEnvTeamId, projectName: fromEnvProjectName };
  }

  try {
    const raw = await fs.readFile(path.join(repoRoot, ".vercel/project.json"), "utf8");
    const parsed = JSON.parse(raw) as { projectId?: string; orgId?: string; projectName?: string };
    return {
      projectId: parsed.projectId ?? null,
      teamId: fromEnvTeamId ?? parsed.orgId ?? null,
      projectName: fromEnvProjectName ?? parsed.projectName ?? null,
    };
  } catch {
    return { projectId: null, teamId: fromEnvTeamId, projectName: fromEnvProjectName };
  }
}

function parseJsonFromCliOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace < 0) throw new Error("CLI JSON payload not found");
  return JSON.parse(trimmed.slice(firstBrace));
}

async function fetchVercelUsageFromCli(projectName: string): Promise<InfraService> {
  try {
    const { stdout } = await execFileAsync("vercel", ["list", projectName, "-F", "json"], {
      cwd: repoRoot,
      timeout: 20_000,
      maxBuffer: 1024 * 1024 * 4,
      env: process.env,
    });

    const payload = parseJsonFromCliOutput(stdout) as {
      deployments?: Array<{
        state?: string;
        target?: string;
        createdAt?: number;
        buildingAt?: number;
        ready?: number;
      }>;
      pagination?: { next?: number | null };
    };
    const deployments = (payload.deployments ?? []).filter((deployment) => deployment.target === "production");
    const readyCount = deployments.filter((deployment) => deployment.state === "READY").length;
    const errorCount = deployments.filter((deployment) => deployment.state === "ERROR").length;
    const latestCreated = deployments.reduce((max, deployment) => {
      return typeof deployment.createdAt === "number" && deployment.createdAt > max ? deployment.createdAt : max;
    }, 0);
    const completedDurations = deployments
      .map((deployment) => {
        if (typeof deployment.buildingAt !== "number") return null;
        const finishedAt = typeof deployment.ready === "number" ? deployment.ready : deployment.createdAt;
        return typeof finishedAt === "number" ? Math.max(0, finishedAt - deployment.buildingAt) : null;
      })
      .filter((duration): duration is number => typeof duration === "number");
    const averageDurationMs = completedDurations.length > 0
      ? Math.round(completedDurations.reduce((sum, duration) => sum + duration, 0) / completedDurations.length)
      : null;

    return {
      id: "vercel",
      label: "Vercel",
      status: "ok",
      summary: "CLI 세션으로 조회됨",
      metrics: [
        { label: "최근 배포 목록", value: `${deployments.length}` },
        { label: "성공 배포", value: readyCount.toLocaleString("en-US") },
        { label: "실패 배포", value: errorCount.toLocaleString("en-US") },
        { label: "평균 빌드", value: averageDurationMs === null ? "-" : `${Math.round(averageDurationMs / 1000)}초` },
        { label: "최근 배포", value: latestCreated > 0 ? formatKoreanDateTime(latestCreated) : "-" },
      ],
      notes: [
        payload.pagination?.next ? "CLI 기본 페이지 기준 최근 배포만 집계했다." : "로컬 Vercel CLI 로그인 세션을 사용했다.",
      ],
    };
  } catch (error) {
    return {
      id: "vercel",
      label: "Vercel",
      status: "error",
      summary: "CLI 조회 실패",
      metrics: [],
      notes: [error instanceof Error ? error.message : "Vercel CLI를 읽지 못했다."],
    };
  }
}

async function fetchVercelUsage(): Promise<InfraService> {
  const token = await getEnvValue("VERCEL_TOKEN", "VERCEL_ACCESS_TOKEN", "VERCEL_API_TOKEN");
  const { projectId, teamId, projectName } = await readVercelProjectLink();
  if ((!token || !projectId) && projectName) {
    return fetchVercelUsageFromCli(projectName);
  }
  if (!token || !projectId) {
    return {
      id: "vercel",
      label: "Vercel",
      status: "missing",
      summary: "키가 없어 조회하지 못함",
      metrics: [],
      notes: ["필수 키: VERCEL_TOKEN(또는 VERCEL_ACCESS_TOKEN, VERCEL_API_TOKEN), VERCEL_PROJECT_ID(또는 .vercel/project.json)"],
    };
  }

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let until: number | null = null;
  let pageCount = 0;
  let totalDeployments = 0;
  let readyDeployments = 0;
  let latestCreated = 0;

  while (pageCount < 6) {
    const query = new URLSearchParams({
      projectId,
      since: String(since),
      limit: "100",
    });
    if (teamId) query.set("teamId", teamId);
    if (typeof until === "number") query.set("until", String(until));

    const response = await fetch(`https://api.vercel.com/v6/deployments?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: withTimeoutSignal(10_000),
    });

    if (!response.ok) {
      return {
        id: "vercel",
        label: "Vercel",
        status: "error",
        summary: "사용량 조회 실패",
        metrics: [],
        notes: [`Deployments API 응답 코드: ${response.status}`],
      };
    }

    const payload = (await response.json()) as {
      deployments?: Array<{ uid?: string; readyState?: string; created?: number }>;
      pagination?: { next?: number };
    };
    const deployments = payload.deployments ?? [];
    totalDeployments += deployments.length;
    readyDeployments += deployments.filter((deployment) => deployment.readyState === "READY").length;

    for (const deployment of deployments) {
      if (typeof deployment.created === "number" && deployment.created > latestCreated) {
        latestCreated = deployment.created;
      }
    }

    if (typeof payload.pagination?.next !== "number" || deployments.length === 0) break;
    until = payload.pagination.next;
    pageCount += 1;
  }

  const latestLabel = latestCreated > 0 ? formatKoreanDateTime(latestCreated) : "-";
  return {
    id: "vercel",
    label: "Vercel",
    status: "ok",
    summary: "최근 30일 배포 사용량",
    metrics: [
      { label: "배포 수(30일)", value: totalDeployments.toLocaleString("en-US") },
      { label: "성공 배포", value: readyDeployments.toLocaleString("en-US") },
      { label: "최근 배포", value: latestLabel },
    ],
    notes: ["빌드 분/대역폭 과금은 별도 Billing API 키 또는 대시보드 확인이 필요할 수 있다."],
  };
}

async function getInfraUsageOverview(): Promise<CompanyOverview["infraUsage"]> {
  const services = await Promise.all([
    fetchVercelUsage().catch(() => ({
      id: "vercel",
      label: "Vercel",
      status: "error",
      summary: "조회 중 오류",
      metrics: [],
      notes: ["예상하지 못한 오류가 발생했다."],
    } satisfies InfraService)),
    fetchR2Usage().catch(() => ({
      id: "r2",
      label: "Cloudflare R2",
      status: "error",
      summary: "조회 중 오류",
      metrics: [],
      notes: ["예상하지 못한 오류가 발생했다."],
    } satisfies InfraService)),
    fetchSupabaseUsage().catch(() => ({
      id: "supabase",
      label: "Supabase",
      status: "error",
      summary: "조회 중 오류",
      metrics: [],
      notes: ["예상하지 못한 오류가 발생했다."],
    } satisfies InfraService)),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    services,
  };
}

export async function getCompanyOverview(): Promise<CompanyOverview> {
  const state = await readCompanyState();
  const [pages, apiRoutes, components, tests, libraries, gitFiles, shipBlockers, releaseNotes, validationNotes, infraUsage, automation] = await Promise.all([
    countFiles("src/app", (entryPath) => entryPath.endsWith("/page.tsx")),
    countFiles("src/app/api", (entryPath) => entryPath.endsWith("/route.ts")),
    countFiles("src/components", (entryPath) => entryPath.endsWith(".tsx")),
    Promise.all([
      countFiles("src/__tests__", (entryPath) => entryPath.endsWith(".test.ts") || entryPath.endsWith(".test.tsx")),
      countFiles("tests/e2e", (entryPath) => entryPath.endsWith(".spec.ts")),
    ]).then(([unit, e2e]) => unit + e2e),
    countFiles("src/lib", (entryPath) => entryPath.endsWith(".ts") || entryPath.endsWith(".tsx")),
    getGitStatus(),
    readSectionBulletHighlights("docs/ship-blockers.md", "### `Blocker`", 3),
    readSectionBulletHighlights("docs/release-readiness.md", "### `Important but not blocker`", 3),
    readSectionBulletHighlights("docs/testing/video-validation-report.md", "### 남은 blocker 메모", 3),
    getInfraUsageOverview(),
    readAutomationCatalog(),
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
    ...(gitFiles.length > 0
      ? [{
          id: `dirty-${gitFiles.length}`,
          kind: "dirty",
          label: "Dirty",
          summary: `현재 워킹트리 변경 파일 ${gitFiles.length}개`,
          sourcePath: null,
          sourceLabel: "git status --short",
          actionLabel: "업무 초안 만들기",
          meaning: "아직 정리되지 않은 변경 파일이 있어 다음 작업 판단이나 검증 범위가 흐려질 수 있다.",
          nextStep: "업무 탭으로 가서 변경 이유, 대상 파일, 필요한 검증을 적은 초안을 만든다.",
          detailLines: gitFiles.map((file) => `${file.status} ${file.path}`),
          editable: true,
        } satisfies CompanyAlert]
      : []),
    ...buildDocAlerts(shipBlockers, {
      kind: "blocker",
      label: "Blocker",
      sourcePath: "docs/ship-blockers.md",
      sourceLabel: "출시 blocker",
      actionLabel: "blocker 문서 열기",
      meaning: "지금 배포를 막는 문제다. 이 항목이 남아 있으면 shipping ready로 보면 안 된다.",
      nextStep: "문서 탭에서 blocker 원인, 영향, 재현 경로, 해결 여부를 현재 코드 기준으로 수정한다.",
    }),
    ...buildDocAlerts(releaseNotes, {
      kind: "release",
      label: "Release",
      sourcePath: "docs/release-readiness.md",
      sourceLabel: "출시 준비도",
      actionLabel: "release 판단 문서 열기",
      meaning: "당장 blocker는 아니어도 출시 보류 판단에 직접 쓰는 위험이다.",
      nextStep: "문서 탭에서 이 위험이 아직 남았는지 확인하고, 검증 근거나 사용자 영향 설명을 최신 상태로 맞춘다.",
    }),
    ...buildDocAlerts(validationNotes, {
      kind: "validation",
      label: "Validation",
      sourcePath: "docs/testing/video-validation-report.md",
      sourceLabel: "검증 리포트",
      actionLabel: "검증 기록 문서 열기",
      meaning: "최근 실행 결과나 재현 근거가 부족해 판단이 흔들릴 수 있다는 신호다.",
      nextStep: "문서 탭에서 어떤 테스트를 돌렸는지, 무엇이 실패했는지, 아직 비어 있는 검증이 무엇인지 업데이트한다.",
    }),
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
    infraUsage,
    focusDocs,
    alerts,
    checks: state.checks.slice(0, 6),
    workspace: {
      consolePath: consoleRoot,
      repoPath: repoRoot,
      stateFilePath: companyStateFile,
      allowedHosts: [...allowedHosts],
    },
    automation: {
      updatedAt: automation.updatedAt || null,
      agentCount: automation.agents.length,
      skillCount: automation.skills.length,
      pluginCount: automation.plugins.length,
      registryPath: automationRegistryFile,
      marketplacePath: automationMarketplaceFile,
      pluginRoot: automationPluginRoot,
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
      agentId: "video-qa-runner",
      taskId: null,
      docPath: "docs/testing/video-validation-report.md",
    })
  );

  await writeCompanyState(nextState);

  return run;
}
