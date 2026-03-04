import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import {
  computeFeedSplit,
  computeRecommendationScore,
  type UserContext,
} from "@/lib/feed-algorithm";

export const FEED_PAGE_SIZE = 20;

/** Lightweight row shape from the joined query */
interface FeedRow {
  id: string;
  profile_id: string;
  type: FeedItemEnriched["type"];
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: {
    name: string;
    handle: string;
    avatar_url: string | null;
    level: number;
    position: string | null;
    city: string | null;
    birth_year: number | null;
  } | null;
  kudos: { count: number }[];
  comments: { count: number }[];
}

/**
 * Fetch a page of feed items with recommendation algorithm.
 */
export async function fetchFeedPage(
  supabase: SupabaseClient,
  userId: string,
  cursor?: string | null
): Promise<{ items: FeedItemEnriched[]; nextCursor: string | null }> {
  // 1. Build user context
  const ctx = await buildUserContext(supabase, userId);
  const { followLimit, recommendLimit } = computeFeedSplit(
    FEED_PAGE_SIZE,
    ctx.followingIds.length
  );

  // 2. Fetch follow feed + recommended feed in parallel
  const [followItems, recommendItems] = await Promise.all([
    followLimit > 0
      ? fetchFollowFeed(supabase, userId, ctx.followingIds, cursor, followLimit)
      : Promise.resolve([]),
    recommendLimit > 0
      ? fetchRecommendedFeed(supabase, userId, ctx, cursor, recommendLimit)
      : Promise.resolve([]),
  ]);

  // 3. Merge — follow items first, then recommended (interleaved by time)
  const merged = mergeFeeds(followItems, recommendItems);

  // 4. Deduplicate by id
  const seen = new Set<string>();
  const unique = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // 5. Check kudos status for current user
  const items = await attachKudosStatus(supabase, userId, unique);

  const nextCursor =
    items.length >= FEED_PAGE_SIZE
      ? items[items.length - 1].created_at
      : null;

  return { items, nextCursor };
}

/**
 * Build user context for recommendation scoring.
 */
async function buildUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  const [profileRes, followsRes, teamsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("city, birth_year, position")
      .eq("id", userId)
      .single(),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId),
    supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", userId)
      .in("role", ["admin", "member"]),
  ]);

  return {
    userId,
    followingIds: (followsRes.data ?? []).map((f) => (f as { following_id: string }).following_id),
    teamIds: (teamsRes.data ?? []).map((t) => (t as { team_id: string }).team_id),
    city: (profileRes.data as { city: string | null } | null)?.city ?? null,
    birthYear: (profileRes.data as { birth_year: number | null } | null)?.birth_year ?? null,
    position: (profileRes.data as { position: string | null } | null)?.position ?? null,
  };
}

/**
 * Fetch feed items from followed players.
 */
async function fetchFollowFeed(
  supabase: SupabaseClient,
  userId: string,
  followingIds: string[],
  cursor: string | null | undefined,
  limit: number
): Promise<FeedItemEnriched[]> {
  if (followingIds.length === 0) return [];

  let query = supabase
    .from("feed_items")
    .select(
      `id, profile_id, type, reference_id, metadata, created_at,
       profiles!feed_items_profile_id_fkey(name, handle, avatar_url, level, position, city, birth_year),
       kudos(count),
       comments(count)`
    )
    .in("profile_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as FeedRow[]).map((row) => mapRowToEnriched(row));
}

/**
 * Fetch recommended feed items (non-followed players).
 * Applies recommendation scoring from the algorithm.
 */
async function fetchRecommendedFeed(
  supabase: SupabaseClient,
  userId: string,
  ctx: UserContext,
  cursor: string | null | undefined,
  limit: number
): Promise<FeedItemEnriched[]> {
  // Fetch more than needed so we can sort by recommendation score
  const fetchLimit = Math.max(limit * 3, 30);

  const excludeIds = [userId, ...ctx.followingIds];

  let query = supabase
    .from("feed_items")
    .select(
      `id, profile_id, type, reference_id, metadata, created_at,
       profiles!feed_items_profile_id_fkey(name, handle, avatar_url, level, position, city, birth_year),
       kudos(count),
       comments(count)`
    )
    .not("profile_id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Get team memberships for all authors in this batch
  const authorIds = [...new Set((data as unknown as FeedRow[]).map((r) => r.profile_id))];
  const { data: authorTeams } = await supabase
    .from("team_members")
    .select("profile_id, team_id")
    .in("profile_id", authorIds)
    .in("role", ["admin", "member"]);

  const authorTeamMap = new Map<string, string[]>();
  for (const row of (authorTeams ?? []) as { profile_id: string; team_id: string }[]) {
    const existing = authorTeamMap.get(row.profile_id) ?? [];
    existing.push(row.team_id);
    authorTeamMap.set(row.profile_id, existing);
  }

  // Score and sort
  const scored = (data as unknown as FeedRow[]).map((row) => {
    const profile = row.profiles;
    const kudosCount = row.kudos?.[0]?.count ?? 0;
    const score = computeRecommendationScore(
      ctx,
      row.profile_id,
      authorTeamMap.get(row.profile_id) ?? [],
      profile?.city ?? null,
      profile?.birth_year ?? null,
      profile?.position ?? null,
      kudosCount
    );
    return { row, score };
  });

  scored.sort((a, b) => {
    // Primary sort: recommendation score desc
    // Secondary sort: time desc
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime();
  });

  return scored.slice(0, limit).map(({ row }) => mapRowToEnriched(row));
}

/**
 * Map a DB row to FeedItemEnriched.
 */
function mapRowToEnriched(row: FeedRow): FeedItemEnriched {
  const profile = row.profiles;
  // Get team name from metadata if available
  const teamName = (row.metadata as Record<string, unknown>)?.team_name as string | null;

  return {
    id: row.id,
    profile_id: row.profile_id,
    type: row.type,
    reference_id: row.reference_id,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
    playerName: profile?.name ?? "Unknown",
    playerHandle: profile?.handle ?? "",
    playerAvatarUrl: profile?.avatar_url ?? null,
    playerLevel: profile?.level ?? 1,
    playerPosition: profile?.position ?? "MF",
    teamName: teamName ?? null,
    kudosCount: row.kudos?.[0]?.count ?? 0,
    hasKudos: false, // will be set in attachKudosStatus
    commentCount: row.comments?.[0]?.count ?? 0,
  };
}

/**
 * Merge two feed arrays, interleaving by created_at.
 */
function mergeFeeds(
  followItems: FeedItemEnriched[],
  recommendItems: FeedItemEnriched[]
): FeedItemEnriched[] {
  const result: FeedItemEnriched[] = [];
  let fi = 0;
  let ri = 0;

  while (fi < followItems.length && ri < recommendItems.length) {
    const fTime = new Date(followItems[fi].created_at).getTime();
    const rTime = new Date(recommendItems[ri].created_at).getTime();
    if (fTime >= rTime) {
      result.push(followItems[fi++]);
    } else {
      result.push(recommendItems[ri++]);
    }
  }
  while (fi < followItems.length) result.push(followItems[fi++]);
  while (ri < recommendItems.length) result.push(recommendItems[ri++]);

  return result;
}

/**
 * Attach hasKudos status for the current user.
 */
async function attachKudosStatus(
  supabase: SupabaseClient,
  userId: string,
  items: FeedItemEnriched[]
): Promise<FeedItemEnriched[]> {
  if (items.length === 0) return items;

  const itemIds = items.map((i) => i.id);
  const { data: myKudos } = await supabase
    .from("kudos")
    .select("feed_item_id")
    .eq("user_id", userId)
    .in("feed_item_id", itemIds);

  const kudosSet = new Set((myKudos ?? []).map((k) => (k as { feed_item_id: string }).feed_item_id));

  return items.map((item) => ({
    ...item,
    hasKudos: kudosSet.has(item.id),
  }));
}

/**
 * Fetch best clips of the current week (for BestCarousel).
 * Returns clips with highest kudos+views from the last 7 days.
 */
export interface BestClipItem {
  id: string;
  feedItemId: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl: string | null;
  tag: string | null;
  kudosCount: number;
}

export async function fetchWeeklyBest(
  supabase: SupabaseClient,
  limit = 10
): Promise<BestClipItem[]> {
  // Get feed items of type "highlight" from last 7 days, sorted by kudos
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("feed_items")
    .select(
      `id, profile_id, metadata, created_at,
       profiles!feed_items_profile_id_fkey(name, handle, avatar_url),
       kudos(count)`
    )
    .eq("type", "highlight")
    .gte("created_at", weekAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  type BestRow = {
    id: string;
    profile_id: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    profiles: { name: string; handle: string; avatar_url: string | null } | null;
    kudos: { count: number }[];
  };

  const rows = data as unknown as BestRow[];

  // Sort by kudos count desc
  const sorted = rows
    .map((row) => ({
      row,
      kudosCount: row.kudos?.[0]?.count ?? 0,
    }))
    .sort((a, b) => b.kudosCount - a.kudosCount)
    .slice(0, limit);

  return sorted.map(({ row, kudosCount }) => {
    const meta = row.metadata ?? {};
    const tags = meta.tags as string[] | undefined;
    return {
      id: row.profile_id,
      feedItemId: row.id,
      thumbnailUrl: (meta.thumbnail_url as string) ?? null,
      videoUrl: (meta.video_url as string) ?? null,
      playerName: row.profiles?.name ?? "Unknown",
      playerHandle: row.profiles?.handle ?? "",
      playerAvatarUrl: row.profiles?.avatar_url ?? null,
      tag: tags?.[0] ?? null,
      kudosCount,
    };
  });
}

/**
 * Check whether the current user has uploaded any clips.
 */
export async function hasUserUploadedClips(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("clips")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  return (count ?? 0) > 0;
}
