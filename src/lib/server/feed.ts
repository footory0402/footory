import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import { getMonthStart } from "@/lib/mvp-scoring";
import { normalizeMediaUrl } from "@/lib/media-url";
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
 * profileHint: 이미 가져온 프로필 데이터가 있으면 전달 → profiles 중복 쿼리 제거
 */
export async function fetchFeedPage(
  supabase: SupabaseClient,
  userId: string,
  cursor?: string | null,
  profileHint?: { city: string | null; birth_year: number | null; position: string | null }
): Promise<{ items: FeedItemEnriched[]; nextCursor: string | null }> {
  // 1. Build user context
  const ctx = await buildUserContext(supabase, userId, profileHint);
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

  // 3. Merge and sort by created_at desc (newest first)
  const merged = [...followItems, ...recommendItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 4. Deduplicate by id + G3: 차단 사용자 콘텐츠 제외
  const blockedSet = new Set(ctx.blockedIds ?? []);
  const seen = new Set<string>();
  let unique = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    if (blockedSet.has(item.profile_id)) return false;
    seen.add(item.id);
    return true;
  });

  // 4.5. 삭제된 클립 참조하는 feed_items 필터링
  const highlightRefs = unique
    .filter((i) => i.type === "highlight" && i.reference_id)
    .map((i) => i.reference_id!);
  if (highlightRefs.length > 0) {
    const { data: existingClips } = await supabase
      .from("clips")
      .select("id")
      .in("id", highlightRefs);
    const existingClipIds = new Set((existingClips ?? []).map((c) => c.id));
    unique = unique.filter((i) => {
      if (i.type === "highlight" && i.reference_id) {
        return existingClipIds.has(i.reference_id);
      }
      return true;
    });
  }

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
 * profileHint가 있으면 profiles 쿼리를 생략 (이미 HomeContent에서 가져온 데이터 재사용)
 */
async function buildUserContext(
  supabase: SupabaseClient,
  userId: string,
  profileHint?: { city: string | null; birth_year: number | null; position: string | null }
): Promise<UserContext> {
  const followsQuery = supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  const teamsQuery = supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", userId)
    .in("role", ["admin", "member"]);
  const blocksQuery = supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  // profileHint가 있으면 profiles 쿼리 생략 (4→3 쿼리)
  const profileQuery = profileHint
    ? null
    : supabase
        .from("profiles")
        .select("city, birth_year, position")
        .eq("id", userId)
        .single();

  const [followsRes, teamsRes, blocksRes, profileRes] = await Promise.all([
    followsQuery,
    teamsQuery,
    blocksQuery,
    profileQuery ?? Promise.resolve({ data: null }),
  ]);

  const blockedIds = new Set<string>();
  for (const row of (blocksRes.data ?? []) as { blocker_id: string; blocked_id: string }[]) {
    blockedIds.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
  }

  const pData = profileRes.data as { city: string | null; birth_year: number | null; position: string | null } | null;
  const city = profileHint?.city ?? pData?.city ?? null;
  const birthYear = profileHint?.birth_year ?? pData?.birth_year ?? null;
  const position = profileHint?.position ?? pData?.position ?? null;

  return {
    userId,
    followingIds: (followsRes.data ?? []).map((f) => (f as { following_id: string }).following_id),
    teamIds: (teamsRes.data ?? []).map((t) => (t as { team_id: string }).team_id),
    city,
    birthYear,
    position,
    blockedIds: [...blockedIds],
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
  // Include own posts alongside followed users' posts
  const profileIds = [userId, ...followingIds];
  if (profileIds.length === 0) return [];

  // 시스템 이벤트 + 스탯/메달 노이즈 제거 — 피드는 영상 중심
  const EXCLUDED_FEED_TYPES = ["top_clip", "season", "featured_change", "stat"];

  let query = supabase
    .from("feed_items")
    .select(
      `id, profile_id, type, reference_id, metadata, created_at,
       profiles!feed_items_profile_id_fkey(name, handle, avatar_url, level, position, city, birth_year),
       kudos(count),
       comments(count)`
    )
    .in("profile_id", profileIds)
    .not("type", "in", `(${EXCLUDED_FEED_TYPES.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = data as unknown as FeedRow[];

  // Fetch team names for all authors
  const authorIds = [...new Set(rows.map((r) => r.profile_id))];
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("profile_id, teams(name)")
    .in("profile_id", authorIds)
    .neq("role", "alumni") as { data: Array<{ profile_id: string; teams: { name: string } | null }> | null };

  const teamNameMap = new Map<string, string>();
  for (const tm of teamMembers ?? []) {
    if (tm.teams?.name && !teamNameMap.has(tm.profile_id)) {
      teamNameMap.set(tm.profile_id, tm.teams.name);
    }
  }

  return rows.map((row) => mapRowToEnriched(row, teamNameMap.get(row.profile_id)));
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

  // 시스템 이벤트 + 스탯/메달 노이즈 제거 — 피드는 영상 중심
  const EXCLUDED_FEED_TYPES = ["top_clip", "season", "featured_change", "stat"];

  let query = supabase
    .from("feed_items")
    .select(
      `id, profile_id, type, reference_id, metadata, created_at,
       profiles!feed_items_profile_id_fkey(name, handle, avatar_url, level, position, city, birth_year),
       kudos(count),
       comments(count)`
    )
    .not("profile_id", "in", `(${excludeIds.join(",")})`)
    .not("type", "in", `(${EXCLUDED_FEED_TYPES.join(",")})`)
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
    .select("profile_id, team_id, teams(name)")
    .in("profile_id", authorIds)
    .neq("role", "alumni") as {
      data: Array<{ profile_id: string; team_id: string; teams: { name: string } | null }> | null;
    };

  const authorTeamMap = new Map<string, string[]>();
  const authorTeamNameMap = new Map<string, string>();
  for (const row of authorTeams ?? []) {
    const existing = authorTeamMap.get(row.profile_id) ?? [];
    existing.push(row.team_id);
    authorTeamMap.set(row.profile_id, existing);
    if (row.teams?.name && !authorTeamNameMap.has(row.profile_id)) {
      authorTeamNameMap.set(row.profile_id, row.teams.name);
    }
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

  return scored.slice(0, limit).map(({ row }) => mapRowToEnriched(row, authorTeamNameMap.get(row.profile_id)));
}

/**
 * Map a DB row to FeedItemEnriched.
 */
function mapRowToEnriched(row: FeedRow, teamName?: string | null): FeedItemEnriched {
  const profile = row.profiles;

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
    playerPosition: profile?.position ?? "MF",
    teamName: teamName ?? null,
    kudosCount: row.kudos?.[0]?.count ?? 0,
    hasKudos: false, // will be set in attachKudosStatus
    commentCount: row.comments?.[0]?.count ?? 0,
    reactions: {}, // will be set in attachKudosStatus
    myReaction: null, // will be set in attachKudosStatus
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

  const followTimes = followItems.map((item) => new Date(item.created_at).getTime());
  const recommendTimes = recommendItems.map((item) => new Date(item.created_at).getTime());

  while (fi < followItems.length && ri < recommendItems.length) {
    const fTime = followTimes[fi];
    const rTime = recommendTimes[ri];
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
 * Attach hasKudos status, per-reaction counts, and myReaction for the current user.
 */
async function attachKudosStatus(
  supabase: SupabaseClient,
  userId: string,
  items: FeedItemEnriched[]
): Promise<FeedItemEnriched[]> {
  if (items.length === 0) return items;

  const itemIds = items.map((i) => i.id);

  // Fetch all kudos for these items to get per-reaction counts + user's own
  const { data: allKudos } = await supabase
    .from("kudos")
    .select("feed_item_id, user_id, reaction")
    .in("feed_item_id", itemIds);

  const kudosList = (allKudos ?? []) as { feed_item_id: string; user_id: string; reaction: string }[];

  // Build per-item reaction maps
  const reactionCounts = new Map<string, Partial<Record<string, number>>>();
  const myReactions = new Map<string, string>();

  for (const k of kudosList) {
    const map = reactionCounts.get(k.feed_item_id) ?? {};
    map[k.reaction] = (map[k.reaction] ?? 0) + 1;
    reactionCounts.set(k.feed_item_id, map);

    if (k.user_id === userId) {
      myReactions.set(k.feed_item_id, k.reaction);
    }
  }

  return items.map((item) => {
    const reactions = reactionCounts.get(item.id) ?? {};
    const myReaction = myReactions.get(item.id) ?? null;
    return {
      ...item,
      hasKudos: myReaction !== null,
      reactions,
      myReaction,
    };
  });
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
 * Lightweight MVP leader fetch for home page teaser.
 * 2 fast queries: weekly_votes → top clip_id, then clip + profile + tags in parallel.
 */
export interface MvpLeaderData {
  playerName: string;
  playerHandle: string;
  playerAvatarUrl: string | null;
  teamName: string | null;
  thumbnailUrl: string | null;
  voteCount: number;
  tags: string[];
}

export async function fetchMvpLeader(supabase: SupabaseClient): Promise<MvpLeaderData | null> {
  const monthStart = getMonthStart();
  const monthStartDate = new Date(`${monthStart}T00:00:00Z`);

  // 1. Get vote counts for this month
  const { data: votes } = await supabase
    .from("weekly_votes")
    .select("clip_id")
    .eq("week_start", monthStart);

  // Tally votes
  const tally: Record<string, number> = {};
  for (const v of votes ?? []) tally[v.clip_id] = (tally[v.clip_id] ?? 0) + 1;
  const topVotedClipId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];

  // 2. If no votes, find the latest clip of this month as leader
  let topClipId = topVotedClipId;
  if (!topClipId) {
    const { data: latestClip } = await supabase
      .from("clips")
      .select("id")
      .gte("created_at", monthStartDate.toISOString())
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    topClipId = latestClip?.id ?? null;
  }

  if (!topClipId) return null;

  // 3. Fetch clip + tags in parallel
  const [clipRes, tagsRes] = await Promise.all([
    supabase
      .from("clips")
      .select("owner_id, thumbnail_url, profiles!clips_owner_id_fkey(name, handle, avatar_url)")
      .eq("id", topClipId)
      .single(),
    supabase
      .from("clip_tags")
      .select("tag_name")
      .eq("clip_id", topClipId)
      .limit(2),
  ]);

  if (!clipRes.data) return null;

  const profile = clipRes.data.profiles as unknown as {
    name: string; handle: string; avatar_url: string | null;
  } | null;

  return {
    playerName: profile?.name ?? "선수",
    playerHandle: profile?.handle ?? "",
    playerAvatarUrl: profile?.avatar_url ?? null,
    teamName: null,
    thumbnailUrl: normalizeMediaUrl(clipRes.data.thumbnail_url),
    voteCount: tally[topClipId] ?? 0,
    tags: (tagsRes.data ?? []).map((t) => t.tag_name),
  };
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
