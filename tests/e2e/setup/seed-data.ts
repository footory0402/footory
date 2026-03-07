import fs from "node:fs/promises";
import path from "node:path";
import { test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { ensureTestAccounts, type ResolvedTestAccounts } from "./test-accounts";

const E2E_TEAM_ID = "11111111-1111-4111-8111-111111111111";
const E2E_CHALLENGE_ID = "22222222-2222-4222-8222-222222222222";
const E2E_CLIP_IDS = [
  "33333333-3333-4333-8333-333333333331",
  "33333333-3333-4333-8333-333333333332",
  "33333333-3333-4333-8333-333333333333",
  "33333333-3333-4333-8333-333333333334",
  "33333333-3333-4333-8333-333333333335",
] as const;
const E2E_FEED_IDS = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442",
  "44444444-4444-4444-8444-444444444443",
  "44444444-4444-4444-8444-444444444444",
  "44444444-4444-4444-8444-444444444445",
] as const;
const E2E_DM_REQUEST_ID = "55555555-5555-4555-8555-555555555555";
const E2E_MESSAGE_ID = "66666666-6666-4666-8666-666666666666";
const E2E_NOTIFICATION_ID = "77777777-7777-4777-8777-777777777777";
const E2E_COMMENT_ID = "99999999-9999-4999-8999-999999999999";

const SKILL_TAGS = ["슈팅", "전진패스", "1v1 돌파", "헤딩경합", "1v1 수비"] as const;
const APP_R2_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
  "https://pub-d8652b9f924e49008171d003cf92a2be.r2.dev";
const E2E_CACHE_DIR = path.resolve(process.cwd(), ".tmp/e2e");
const SEED_CACHE_PATH = path.join(E2E_CACHE_DIR, "seed-data.json");

export interface SeededData {
  accounts: ResolvedTestAccounts;
  teamId: string;
  challengeId: string;
  clipIds: string[];
  feedItemIds: string[];
  conversationId: string;
}

let seedPromise: Promise<SeededData> | null = null;
let seededData: SeededData | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(E2E_CACHE_DIR, { recursive: true });
}

async function readSeedCache(): Promise<SeededData | null> {
  try {
    const raw = await fs.readFile(SEED_CACHE_PATH, "utf8");
    return JSON.parse(raw) as SeededData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeSeedCache(data: SeededData): Promise<void> {
  await ensureCacheDir();
  await fs.writeFile(SEED_CACHE_PATH, JSON.stringify(data), "utf8");
}

async function withSeedLock<T>(run: () => Promise<T>): Promise<T> {
  await ensureCacheDir();
  const lockPath = path.join(E2E_CACHE_DIR, "seed-data.lock");

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

async function seedInternalWithRetry(attempt = 1, maxAttempts = 2): Promise<SeededData> {
  try {
    return await seedInternal();
  } catch (error) {
    if (attempt >= maxAttempts) {
      throw error;
    }

    await sleep(300 * attempt);
    return seedInternalWithRetry(attempt + 1, maxAttempts);
  }
}

function getServiceRoleClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for deterministic E2E seed data"
    );
  }

  return createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getCurrentWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

async function upsertTeam(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const { error } = await admin.from("teams").upsert(
    {
      id: E2E_TEAM_ID,
      handle: "e2e_fc",
      name: "E2E FC",
      city: "Seoul",
      description: "E2E test team",
      invite_code: "E2E2601",
      created_by: accounts.coach.id,
    } as never,
    { onConflict: "id" }
  );

  if (error) throw error;

  const memberRows = [
    {
      id: "88888888-8888-4888-8888-888888888881",
      team_id: E2E_TEAM_ID,
      profile_id: accounts.coach.id,
      role: "admin",
    },
    {
      id: "88888888-8888-4888-8888-888888888882",
      team_id: E2E_TEAM_ID,
      profile_id: accounts.player.id,
      role: "member",
    },
  ];

  const { error: memberError } = await admin
    .from("team_members")
    .upsert(memberRows as never, { onConflict: "team_id,profile_id" });

  if (memberError) throw memberError;
}

async function upsertClipsAndFeed(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const now = Date.now();

  const clipRows = E2E_CLIP_IDS.map((clipId, idx) => {
    const i = idx + 1;
    return {
      id: clipId,
      owner_id: accounts.player.id,
      uploaded_by: accounts.player.id,
      video_url: `${APP_R2_URL}/e2e/e2e-player-clip-${i}.mp4`,
      thumbnail_url: `${APP_R2_URL}/e2e/e2e-player-clip-${i}.jpg`,
      duration_seconds: 20 + i,
      memo: `E2E clip ${i}`,
      highlight_status: "done",
      highlight_start: 0,
      highlight_end: 20 + i,
      created_at: new Date(now - idx * 60_000).toISOString(),
    };
  });

  const { error: clipError } = await admin
    .from("clips")
    .upsert(clipRows as never, { onConflict: "id" });

  if (clipError) throw clipError;

  const { error: clearTagsError } = await admin
    .from("clip_tags")
    .delete()
    .in("clip_id", [...E2E_CLIP_IDS]);

  if (clearTagsError) throw clearTagsError;

  const clipTagRows = E2E_CLIP_IDS.map((clipId, idx) => ({
    clip_id: clipId,
    tag_name: SKILL_TAGS[idx],
    is_top: idx === 0,
  }));

  const { error: tagError } = await admin.from("clip_tags").insert(clipTagRows as never);
  if (tagError) throw tagError;

  const feedRows = E2E_FEED_IDS.map((feedId, idx) => {
    const i = idx + 1;
    return {
      id: feedId,
      profile_id: accounts.player.id,
      type: "highlight",
      reference_id: E2E_CLIP_IDS[idx],
      metadata: {
        tags: [SKILL_TAGS[idx]],
        description: `E2E 하이라이트 ${i}`,
        thumbnail_url: `${APP_R2_URL}/e2e/e2e-player-clip-${i}.jpg`,
        duration: 20 + i,
        video_url: `${APP_R2_URL}/e2e/e2e-player-clip-${i}.mp4`,
        team_name: "E2E FC",
      },
      created_at: new Date(now - idx * 60_000).toISOString(),
    };
  });

  const { error: feedError } = await admin
    .from("feed_items")
    .upsert(feedRows as never, { onConflict: "id" });

  if (feedError) throw feedError;
}

async function upsertChallenge(admin: SupabaseClient<Database>): Promise<void> {
  const { error } = await admin.from("challenges").upsert(
    {
      id: E2E_CHALLENGE_ID,
      title: "E2E 챌린지 - 슈팅",
      description: "E2E 테스트용 활성 챌린지",
      skill_tag: "슈팅",
      week_start: getCurrentWeekStartISO(),
      is_active: true,
    } as never,
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertFollowRelations(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const rows = [
    { follower_id: accounts.player.id, following_id: accounts.coach.id },
    { follower_id: accounts.player.id, following_id: accounts.scout.id },
    { follower_id: accounts.parent.id, following_id: accounts.player.id },
    { follower_id: accounts.coach.id, following_id: accounts.player.id },
    { follower_id: accounts.scout.id, following_id: accounts.player.id },
  ];

  const { error } = await admin
    .from("follows")
    .upsert(rows as never, { onConflict: "follower_id,following_id" });

  if (error) throw error;
}

async function ensureConversation(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<string> {
  const { data: existing, error: findError } = await admin
    .from("conversations")
    .select("id")
    .eq("participant_1", accounts.coach.id)
    .eq("participant_2", accounts.player.id)
    .maybeSingle();

  if (findError) throw findError;

  if (existing?.id) {
    await admin
      .from("messages")
      .upsert(
        {
          id: E2E_MESSAGE_ID,
          conversation_id: existing.id,
          sender_id: accounts.coach.id,
          content: "E2E 코치 메시지",
          is_read: false,
        } as never,
        { onConflict: "id" }
      );

    return existing.id;
  }

  const { data: created, error: createError } = await admin
    .from("conversations")
    .insert({
      participant_1: accounts.coach.id,
      participant_2: accounts.player.id,
      last_message_preview: "E2E 코치 메시지",
      last_message_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (createError || !created?.id) {
    throw createError ?? new Error("Failed to create E2E conversation");
  }

  const { error: messageError } = await admin.from("messages").upsert(
    {
      id: E2E_MESSAGE_ID,
      conversation_id: created.id,
      sender_id: accounts.coach.id,
      content: "E2E 코치 메시지",
      is_read: false,
    } as never,
    { onConflict: "id" }
  );

  if (messageError) throw messageError;

  return created.id;
}

async function upsertDmRequest(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const { error } = await admin.from("dm_requests").upsert(
    {
      id: E2E_DM_REQUEST_ID,
      sender_id: accounts.scout.id,
      receiver_id: accounts.player.id,
      preview_message: "안녕하세요, 경기 영상을 보고 연락드렸어요.",
      status: "pending",
    } as never,
    { onConflict: "sender_id,receiver_id" }
  );

  if (error) throw error;
}

async function upsertNotification(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const { error } = await admin.from("notifications").upsert(
    {
      id: E2E_NOTIFICATION_ID,
      user_id: accounts.player.id,
      type: "kudos",
      title: "E2E Coach님이 응원했습니다",
      body: "E2E 테스트 알림",
      reference_id: E2E_FEED_IDS[0],
      read: false,
      action_url: "/",
      group_key: "e2e_kudos",
    } as never,
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertComments(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  const { error } = await admin.from("comments").upsert(
    {
      id: E2E_COMMENT_ID,
      feed_item_id: E2E_FEED_IDS[0],
      user_id: accounts.coach.id,
      content: "E2E coach comment",
      parent_id: null,
    } as never,
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function resetMutableE2eState(
  admin: SupabaseClient<Database>,
  accounts: ResolvedTestAccounts
): Promise<void> {
  await admin.from("quest_progress").delete().eq("profile_id", accounts.player.id);
  await admin
    .from("blocks")
    .delete()
    .or(
      `and(blocker_id.eq.${accounts.coach.id},blocked_id.eq.${accounts.player.id}),` +
        `and(blocker_id.eq.${accounts.player.id},blocked_id.eq.${accounts.coach.id}),` +
        `and(blocker_id.eq.${accounts.scout.id},blocked_id.eq.${accounts.player.id}),` +
        `and(blocker_id.eq.${accounts.player.id},blocked_id.eq.${accounts.scout.id})`
    );
  await admin.from("scout_watchlist").delete().eq("scout_id", accounts.scout.id);
}

async function seedInternal(): Promise<SeededData> {
  const accounts = await ensureTestAccounts();
  const admin = getServiceRoleClient();

  await resetMutableE2eState(admin, accounts);
  await upsertTeam(admin, accounts);
  await upsertClipsAndFeed(admin, accounts);
  await upsertChallenge(admin);
  await upsertFollowRelations(admin, accounts);
  const conversationId = await ensureConversation(admin, accounts);
  await upsertDmRequest(admin, accounts);
  await upsertNotification(admin, accounts);
  await upsertComments(admin, accounts);

  return {
    accounts,
    teamId: E2E_TEAM_ID,
    challengeId: E2E_CHALLENGE_ID,
    clipIds: [...E2E_CLIP_IDS],
    feedItemIds: [...E2E_FEED_IDS],
    conversationId,
  };
}

export async function ensureSeedData(): Promise<SeededData> {
  if (seededData) {
    return seededData;
  }

  const cachedSeed = await readSeedCache();
  if (cachedSeed) {
    seededData = cachedSeed;
    return cachedSeed;
  }

  if (!seedPromise) {
    seedPromise = withSeedLock(async () => {
      const lockedCache = await readSeedCache();
      if (lockedCache) {
        return lockedCache;
      }

      const createdSeed = await seedInternalWithRetry();
      await writeSeedCache(createdSeed);
      return createdSeed;
    });
  }

  try {
    seededData = await seedPromise;
    return seededData;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}

export async function ensureSeedDataOrSkip(): Promise<SeededData | null> {
  try {
    return await ensureSeedData();
  } catch (error) {
    test.skip(true, `Seed data is unavailable: ${(error as Error).message}`);
    return null;
  }
}
