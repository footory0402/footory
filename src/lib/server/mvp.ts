import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { getMonthStart, isVotingOpen, rankCandidates } from "@/lib/mvp-scoring";
import { MAX_MONTHLY_VOTES } from "@/lib/constants";
import type { MvpTierKey, Position } from "@/lib/constants";
import { normalizeMediaUrl } from "@/lib/media-url";

type ServerSupabase = SupabaseClient<Database>;

interface FeedItemStatsRow {
  id: string;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  kudos: { count: number }[];
  comments: { count: number }[];
}

export interface MvpMonthlyStats {
  clipCount: number;
  totalVotes: number;
  newPlayers: number;
}

/** @deprecated Use MvpMonthlyStats instead */
export type MvpWeeklyStats = MvpMonthlyStats;

export interface MvpCandidateData {
  clipId: string;
  ownerId: string;
  rank: number;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl?: string;
  playerLevel: number;
  playerPosition: Position | null;
  teamName?: string;
  tags: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  totalScore: number;
  autoScore: number;
  voteScore: number;
  viewsCount: number;
  kudosCount: number;
  voteCount: number;
  mvpCount: number;
  mvpTier: MvpTierKey | null;
  isFollowing?: boolean;
}

export interface MvpCandidatesPayload {
  candidates: MvpCandidateData[];
  myVotes: string[];
  votesRemaining: number;
  votingOpen: boolean;
  monthStart: string;
  monthlyStats: MvpMonthlyStats;
  /** @deprecated Use monthStart instead */
  weekStart: string;
  /** @deprecated Use monthlyStats instead */
  weeklyStats: MvpMonthlyStats;
}

export async function fetchMvpCandidatesData(
  supabase: ServerSupabase,
  userId: string
): Promise<MvpCandidatesPayload> {
  const monthStart = getMonthStart();
  const monthStartDate = new Date(`${monthStart}T00:00:00Z`);
  const votingOpen = isVotingOpen();

  const [
    { data: clips },
    { data: myVotes },
    { count: totalVoteCount },
    { count: newPlayerCount },
  ] = await Promise.all([
    supabase
      .from("clips")
      .select("id, owner_id, video_url, thumbnail_url, created_at")
      .gte("created_at", monthStartDate.toISOString())
      .eq("visibility", "public")
      .order("created_at", { ascending: false }),
    supabase
      .from("weekly_votes")
      .select("clip_id")
      .eq("voter_id", userId)
      .eq("week_start", monthStart),
    supabase
      .from("weekly_votes")
      .select("id", { count: "exact", head: true })
      .eq("week_start", monthStart),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStartDate.toISOString()),
  ]);

  const myVotedClipIds = (myVotes ?? []).map((vote) => vote.clip_id);
  const votesRemaining = MAX_MONTHLY_VOTES - myVotedClipIds.length;

  if (!clips?.length) {
    return {
      candidates: [],
      myVotes: myVotedClipIds,
      votesRemaining,
      votingOpen,
      monthStart,
      monthlyStats: {
        clipCount: 0,
        totalVotes: totalVoteCount ?? 0,
        newPlayers: newPlayerCount ?? 0,
      },
      weekStart: monthStart,
      weeklyStats: {
        clipCount: 0,
        totalVotes: totalVoteCount ?? 0,
        newPlayers: newPlayerCount ?? 0,
      },
    };
  }

  const clipIds = clips.map((clip) => clip.id);
  const ownerIds = [...new Set(clips.map((clip) => clip.owner_id))];

  const [
    { data: votes },
    { data: feedItems },
    { data: profiles },
    { data: myFollows },
    { data: teamMembers },
    { data: clipTags },
  ] = await Promise.all([
    supabase
      .from("weekly_votes")
      .select("clip_id")
      .eq("week_start", monthStart)
      .in("clip_id", clipIds),
    (supabase
      .from("feed_items")
      .select("id, reference_id, metadata, kudos(count), comments(count)")
      .eq("type", "highlight")
      .in("reference_id", clipIds) as unknown as Promise<{
      data: FeedItemStatsRow[] | null;
    }>),
    supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, views_count, mvp_count, mvp_tier")
      .in("id", ownerIds),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .in("following_id", ownerIds),
    (supabase
      .from("team_members")
      .select("profile_id, teams(name)")
      .in("profile_id", ownerIds)
      .neq("role", "alumni") as unknown as Promise<{
      data:
        | Array<{
            profile_id: string;
            teams: { name: string } | null;
          }>
        | null;
    }>),
    supabase.from("clip_tags").select("clip_id, tag_name").in("clip_id", clipIds),
  ]);

  const voteCounts: Record<string, number> = {};
  for (const vote of votes ?? []) {
    voteCounts[vote.clip_id] = (voteCounts[vote.clip_id] ?? 0) + 1;
  }

  const feedThumbByClip: Record<string, string> = {};
  const kudosCounts: Record<string, number> = {};
  const commentsCounts: Record<string, number> = {};

  for (const feedItem of (feedItems ?? []) as FeedItemStatsRow[]) {
    if (!feedItem.reference_id) {
      continue;
    }

    const clipId = feedItem.reference_id;
    const metadata = feedItem.metadata as Record<string, unknown> | null;
    const thumb =
      typeof metadata?.thumbnail_url === "string" ? metadata.thumbnail_url : null;
    if (thumb && !feedThumbByClip[clipId]) {
      feedThumbByClip[clipId] = thumb;
    }

    kudosCounts[clipId] =
      (kudosCounts[clipId] ?? 0) + (feedItem.kudos?.[0]?.count ?? 0);
    commentsCounts[clipId] =
      (commentsCounts[clipId] ?? 0) + (feedItem.comments?.[0]?.count ?? 0);
  }

  const followingSet = new Set(
    (myFollows ?? []).map((follow) => follow.following_id)
  );

  const profileMap: Record<
    string,
    (typeof profiles extends (infer T)[] | null ? T : never)
  > = {};
  for (const profile of profiles ?? []) {
    profileMap[profile.id] = profile;
  }

  const teamMap: Record<string, string> = {};
  for (const teamMember of teamMembers ?? []) {
    if (teamMember.teams?.name) {
      teamMap[teamMember.profile_id] = teamMember.teams.name;
    }
  }

  const tagMap: Record<string, string[]> = {};
  for (const clipTag of clipTags ?? []) {
    if (!tagMap[clipTag.clip_id]) {
      tagMap[clipTag.clip_id] = [];
    }
    tagMap[clipTag.clip_id].push(clipTag.tag_name);
  }

  const clipMap = new Map(clips.map((clip) => [clip.id, clip]));
  const clipsWithStats = clips.map((clip) => ({
    id: clip.id,
    owner_id: clip.owner_id,
    views_count: profileMap[clip.owner_id]?.views_count ?? 0,
    kudos_count: kudosCounts[clip.id] ?? 0,
    comments_count: commentsCounts[clip.id] ?? 0,
  }));
  const clipsWithStatsMap = new Map(clipsWithStats.map((clip) => [clip.id, clip]));
  const ranked = rankCandidates(clipsWithStats, voteCounts);

  const candidates = ranked.map((rankedItem, index) => {
    const clip = clipMap.get(rankedItem.clipId);
    const profile = profileMap[rankedItem.ownerId];

    return {
      clipId: rankedItem.clipId,
      ownerId: rankedItem.ownerId,
      rank: index + 1,
      playerName: profile?.name ?? "선수",
      playerHandle: profile?.handle ?? "",
      playerAvatarUrl: profile?.avatar_url ?? undefined,
      playerLevel: profile?.level ?? 1,
      playerPosition: profile?.position ?? null,
      teamName: teamMap[rankedItem.ownerId] ?? undefined,
      tags: tagMap[rankedItem.clipId] ?? [],
      videoUrl: clip?.video_url ?? undefined,
      thumbnailUrl:
        normalizeMediaUrl(clip?.thumbnail_url) ??
        normalizeMediaUrl(feedThumbByClip[rankedItem.clipId]) ??
        undefined,
      totalScore: rankedItem.totalScore,
      autoScore: rankedItem.autoNorm,
      voteScore: rankedItem.voteNorm,
      viewsCount: clipsWithStatsMap.get(rankedItem.clipId)?.views_count ?? 0,
      kudosCount: kudosCounts[rankedItem.clipId] ?? 0,
      voteCount: rankedItem.voteCount,
      mvpCount: profile?.mvp_count ?? 0,
      mvpTier: profile?.mvp_tier ?? null,
      isFollowing: followingSet.has(rankedItem.ownerId),
    };
  });

  const monthlyStats: MvpMonthlyStats = {
    clipCount: clips.length,
    totalVotes: totalVoteCount ?? 0,
    newPlayers: newPlayerCount ?? 0,
  };

  return {
    candidates,
    myVotes: myVotedClipIds,
    votesRemaining,
    votingOpen,
    monthStart,
    monthlyStats,
    weekStart: monthStart,
    weeklyStats: monthlyStats,
  };
}
