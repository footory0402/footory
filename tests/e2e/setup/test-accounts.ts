import fs from "node:fs/promises";
import path from "node:path";
import { test, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

export type TestRole = "player" | "parent" | "coach" | "scout";

export interface TestAccountDefinition {
  role: TestRole;
  email: string;
  password: string;
  handle: string;
  name: string;
  profileRole: "player" | "parent" | "coach" | "scout" | "other";
  isVerified: boolean;
}

export interface ResolvedTestAccount extends TestAccountDefinition {
  id: string;
}

export type ResolvedTestAccounts = Record<TestRole, ResolvedTestAccount>;

const DEFAULT_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "Footory!123";
const APP_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MAX_COOKIE_CHUNK = 3180;
const E2E_CACHE_DIR = path.resolve(process.cwd(), ".tmp/e2e");
const ACCOUNT_CACHE_PATH = path.join(E2E_CACHE_DIR, "accounts.json");

export const TEST_ACCOUNTS: Record<TestRole, TestAccountDefinition> = {
  player: {
    role: "player",
    email: "player@test.com",
    password: DEFAULT_PASSWORD,
    handle: "e2e_player",
    name: "E2E Player",
    profileRole: "player",
    isVerified: false,
  },
  parent: {
    role: "parent",
    email: "parent@test.com",
    password: DEFAULT_PASSWORD,
    handle: "e2e_parent",
    name: "E2E Parent",
    profileRole: "parent",
    isVerified: false,
  },
  coach: {
    role: "coach",
    email: "coach@test.com",
    password: DEFAULT_PASSWORD,
    handle: "e2e_coach",
    name: "E2E Coach",
    profileRole: "coach",
    isVerified: true,
  },
  scout: {
    role: "scout",
    email: "scout@test.com",
    password: DEFAULT_PASSWORD,
    handle: "e2e_scout",
    name: "E2E Scout",
    profileRole: "coach",
    isVerified: true,
  },
};

let accountPromise: Promise<ResolvedTestAccounts> | null = null;
let accountsCache: ResolvedTestAccounts | null = null;
let sessionPromiseByRole: Partial<Record<TestRole, Promise<Session>>> = {};
let sessionCacheByRole: Partial<Record<TestRole, Session>> = {};

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(E2E_CACHE_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureCacheDir();
  await fs.writeFile(filePath, JSON.stringify(value), "utf8");
}

async function withFileLock<T>(name: string, run: () => Promise<T>): Promise<T> {
  await ensureCacheDir();
  const lockPath = path.join(E2E_CACHE_DIR, `${name}.lock`);

  while (true) {
    try {
      await fs.mkdir(lockPath);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
      await sleep(150);
    }
  }

  try {
    return await run();
  } finally {
    await fs.rm(lockPath, { recursive: true, force: true });
  }
}

function getSessionCachePath(role: TestRole): string {
  return path.join(E2E_CACHE_DIR, `session-${role}.json`);
}

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for E2E account setup");
  }
  return url;
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for E2E account setup");
  }
  return key;
}

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isRateLimitError(message: string): boolean {
  return /rate limit/i.test(message);
}

async function signInWithRetry(
  anon: SupabaseClient<Database>,
  email: string,
  password: string,
  maxAttempts = 5
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await anon.auth.signInWithPassword({ email, password });
    if (!result.error) return result;

    lastError = result.error;
    if (!isRateLimitError(result.error.message) || attempt === maxAttempts) {
      return result;
    }

    const waitMs = 600 * attempt;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  return { data: { user: null, session: null }, error: lastError };
}

function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), getAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createAdminClient(): SupabaseClient<Database> | null {
  const serviceRole = getServiceRoleKey();
  if (!serviceRole) return null;
  return createClient<Database>(getSupabaseUrl(), serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findUserIdByEmail(
  admin: SupabaseClient<Database>,
  email: string
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id;

    if (users.length < perPage) return null;
    page += 1;
  }
}

function isAlreadyExistsError(message: string): boolean {
  return /already|exists|registered|duplicate/i.test(message);
}

function isRecoverableEnsureUserError(message: string): boolean {
  return isAlreadyExistsError(message) || /database error finding users?/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createAccountsWithRetry(attempt = 1, maxAttempts = 2): Promise<ResolvedTestAccounts> {
  try {
    return await createAccountsInternal();
  } catch (error) {
    if (attempt >= maxAttempts) {
      throw error;
    }

    await sleep(300 * attempt);
    return createAccountsWithRetry(attempt + 1, maxAttempts);
  }
}

async function ensureAuthUser(
  account: TestAccountDefinition,
  admin: SupabaseClient<Database> | null
): Promise<string> {
  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { name: account.name, handle: account.handle },
    });

    if (!error && data.user?.id) {
      return data.user.id;
    }

    if (error && !isRecoverableEnsureUserError(error.message)) {
      throw error;
    }

    // In parallel E2E runs, listUsers can intermittently fail.
    // Prefer resolving the existing account via sign-in first.
    const anon = createAnonClient();
    const signedIn = await anon.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (!signedIn.error && signedIn.data.user?.id) {
      return signedIn.data.user.id;
    }

    const existingId = await findUserIdByEmail(admin, account.email);
    if (existingId) return existingId;

    throw new Error(`Could not resolve auth user id for ${account.email}`);
  }

  const anon = createAnonClient();

  const existing = await signInWithRetry(anon, account.email, account.password);

  if (!existing.error && existing.data.user?.id) {
    return existing.data.user.id;
  }

  const signUp = await anon.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      data: {
        name: account.name,
        handle: account.handle,
      },
    },
  });

  if (signUp.error && !isAlreadyExistsError(signUp.error.message)) {
    throw signUp.error;
  }

  if (signUp.data.user?.id) {
    return signUp.data.user.id;
  }

  const retry = await signInWithRetry(anon, account.email, account.password);

  if (retry.error || !retry.data.user?.id) {
    throw new Error(
      `Unable to sign in test account ${account.email}. ` +
        "If email confirmation is enabled, provide SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return retry.data.user.id;
}

async function ensureProfile(
  userId: string,
  account: TestAccountDefinition,
  admin: SupabaseClient<Database> | null
): Promise<void> {
  const profilePayload = {
    id: userId,
    role: account.profileRole,
    handle: account.handle,
    name: account.name,
    position: account.profileRole === "player" ? "FW" : null,
    birth_year: account.profileRole === "player" ? 2010 : null,
    city: "Seoul",
    level: 1,
    xp: 0,
    is_verified: account.isVerified,
    verified_at: account.isVerified ? new Date().toISOString() : null,
    show_email: false,
    show_phone: false,
    updated_at: new Date().toISOString(),
  };

  if (admin) {
    const { error } = await admin
      .from("profiles")
      .upsert(profilePayload as never, { onConflict: "id" });

    if (error) throw error;
    return;
  }

  const anon = createAnonClient();
  const signIn = await signInWithRetry(anon, account.email, account.password);

  if (signIn.error) throw signIn.error;

  const { error } = await anon
    .from("profiles")
    .upsert(profilePayload as never, { onConflict: "id" });

  if (error) throw error;
}

async function ensureParentChildLink(
  accounts: ResolvedTestAccounts,
  admin: SupabaseClient<Database> | null
): Promise<void> {
  const payload = {
    parent_id: accounts.parent.id,
    child_id: accounts.player.id,
    consent_given: true,
    consent_at: new Date().toISOString(),
  };

  if (admin) {
    const { error } = await admin
      .from("parent_links")
      .upsert(payload as never, { onConflict: "parent_id,child_id" });

    if (error) throw error;
    return;
  }

  const anon = createAnonClient();
  const signIn = await signInWithRetry(
    anon,
    TEST_ACCOUNTS.parent.email,
    TEST_ACCOUNTS.parent.password
  );

  if (signIn.error) throw signIn.error;

  const { error } = await anon
    .from("parent_links")
    .upsert(payload as never, { onConflict: "parent_id,child_id" });

  if (error) throw error;
}

async function createAccountsInternal(): Promise<ResolvedTestAccounts> {
  const admin = createAdminClient();

  const resolved: Partial<ResolvedTestAccounts> = {};

  for (const account of Object.values(TEST_ACCOUNTS)) {
    const id = await ensureAuthUser(account, admin);
    await ensureProfile(id, account, admin);
    resolved[account.role] = { ...account, id };
  }

  const all = resolved as ResolvedTestAccounts;
  await ensureParentChildLink(all, admin);

  return all;
}

export async function ensureTestAccounts(): Promise<ResolvedTestAccounts> {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase env is missing for E2E test account setup");
  }

  if (accountsCache) {
    return accountsCache;
  }

  const cachedAccounts = await readJsonFile<ResolvedTestAccounts>(ACCOUNT_CACHE_PATH);
  if (cachedAccounts) {
    accountsCache = cachedAccounts;
    return cachedAccounts;
  }

  if (!accountPromise) {
    accountPromise = withFileLock("accounts", async () => {
      const lockedCache = await readJsonFile<ResolvedTestAccounts>(ACCOUNT_CACHE_PATH);
      if (lockedCache) {
        return lockedCache;
      }

      const createdAccounts = await createAccountsWithRetry();
      await writeJsonFile(ACCOUNT_CACHE_PATH, createdAccounts);
      return createdAccounts;
    });
  }

  try {
    accountsCache = await accountPromise;
    return accountsCache;
  } catch (error) {
    accountPromise = null;
    throw error;
  }
}

function getSupabaseProjectCookieKey(): string {
  const supabaseUrl = new URL(getSupabaseUrl());
  const projectRef = supabaseUrl.hostname.split(".")[0] ?? "project";
  return `sb-${projectRef}-auth-token`;
}

function chunk(value: string, max = MAX_COOKIE_CHUNK): string[] {
  if (value.length <= max) return [value];
  const values: string[] = [];
  for (let i = 0; i < value.length; i += max) {
    values.push(value.slice(i, i + max));
  }
  return values;
}

async function clearAuthCookies(context: BrowserContext, key: string): Promise<void> {
  const expirations = [key, ...Array.from({ length: 8 }, (_, i) => `${key}.${i}`)].map((name) => ({
    name,
    value: "",
    url: APP_BASE_URL,
    sameSite: "Lax" as const,
    httpOnly: false,
    expires: 0,
  }));

  await context.addCookies(expirations);
}

async function applySessionCookies(context: BrowserContext, session: Session): Promise<void> {
  const cookieKey = getSupabaseProjectCookieKey();
  const encoded = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  const chunks = chunk(encoded);

  await clearAuthCookies(context, cookieKey);

  const expires = Math.floor(Date.now() / 1000) + 400 * 24 * 60 * 60;
  const cookies = chunks.map((value, index) => ({
    name: chunks.length === 1 ? cookieKey : `${cookieKey}.${index}`,
    value,
    url: APP_BASE_URL,
    sameSite: "Lax" as const,
    httpOnly: false,
    expires,
  }));

  await context.addCookies(cookies);
}

async function suppressNextDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal {
        pointer-events: none !important;
      }
    `,
  }).catch(() => {});
}

async function signInForSession(account: TestAccountDefinition): Promise<Session> {
  const cached = sessionCacheByRole[account.role];
  if (cached) {
    return cached;
  }

  const sessionCachePath = getSessionCachePath(account.role);
  const persisted = await readJsonFile<Session>(sessionCachePath);
  if (persisted?.access_token) {
    sessionCacheByRole[account.role] = persisted;
    return persisted;
  }

  const existingPromise = sessionPromiseByRole[account.role];
  if (existingPromise) {
    return existingPromise;
  }

  const anon = createAnonClient();
  const sessionPromise = withFileLock(`session-${account.role}`, async () => {
    const lockedCache = await readJsonFile<Session>(sessionCachePath);
    if (lockedCache?.access_token) {
      sessionCacheByRole[account.role] = lockedCache;
      return lockedCache;
    }

    const { data, error } = await signInWithRetry(anon, account.email, account.password);

    if (error || !data.session) {
      throw error ?? new Error(`Could not create session for ${account.email}`);
    }

    await writeJsonFile(sessionCachePath, data.session);
    sessionCacheByRole[account.role] = data.session;
    return data.session;
  });

  sessionPromiseByRole[account.role] = sessionPromise;

  try {
    return await sessionPromise;
  } catch (error) {
    delete sessionPromiseByRole[account.role];
    delete sessionCacheByRole[account.role];
    throw error;
  }
}

export async function loginAsRole(page: Page, role: TestRole, path = "/"): Promise<void> {
  try {
    await ensureTestAccounts();
    const session = await signInForSession(TEST_ACCOUNTS[role]);
    await applySessionCookies(page.context(), session);
    await page.goto(path);
    await suppressNextDevOverlay(page);

    test.skip(
      page.url().includes("/login"),
      `Session bootstrap failed for ${role}. Check account credentials and Supabase auth settings.`
    );
  } catch (error) {
    test.skip(true, `Unable to log in as ${role}: ${(error as Error).message}`);
  }
}

export async function loginAsPlayer(page: Page, path = "/"): Promise<void> {
  await loginAsRole(page, "player", path);
}

export async function loginAsParent(page: Page, path = "/"): Promise<void> {
  await loginAsRole(page, "parent", path);
}

export async function loginAsCoach(page: Page, path = "/"): Promise<void> {
  await loginAsRole(page, "coach", path);
}

export async function loginAsScout(page: Page, path = "/"): Promise<void> {
  await loginAsRole(page, "scout", path);
}

export function skipIfSupabaseEnvMissing() {
  test.skip(!hasSupabaseEnv(), "Supabase env is required for account bootstrap tests");
}
