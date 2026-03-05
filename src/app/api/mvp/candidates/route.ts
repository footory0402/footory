import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, rankCandidates, isVotingOpen } from "@/lib/mvp-scoring";
import { MAX_WEEKLY_VOTES } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getWeekStart();

  // 1. Get all clips created this week with their owners' profiles
  const weekStartDate = new Date(weekStart + "T00:00:00Z");
  const { data: clips } = await supabase
    .from("clips")
    .select("id, owner_id, video_url, thumbnail_url, memo, duration_seconds, created_at")
    .gte("created_at", weekStartDate.toISOString())
    .order("created_at", { ascending: false });

  if (!clips || clips.length === 0) {
    return NextResponse.json({
      candidates: [],
      myVotes: [],
      votesRemaining: MAX_WEEKLY_VOTES,
      votingOpen: isVotingOpen(),
      weekStart,
      weeklyStats: { clipCount: 0, totalVotes: 0, newPlayers: 0 },
    });
  }

  // 2. Batch 1: votes, myVotes, feedItems in parallel
  const clipIds = clips.map((c) => c.id);
  const ownerIds = [...new Set(clips.map((c) => c.owner_id))];

  const [
    { data: votes },
    { data: myVotes },
    { data: feedItems },
  ] = await Promise.all([
    supabase
      .from("weekly_votes")
      .select("clip_id")
      .eq("week_start", weekStart)
      .in("clip_id", clipIds),
    supabase
      .from("weekly_votes")
      .select("clip_id")
      .eq("voter_id", user.id)
      .eq("week_start", weekStart),
    supabase
      .from("feed_items")
      .select("id, profile_id, reference_id, metadata")
      .eq("type", "highlight")
      .in("reference_id", clipIds),
  ]);

  const voteCounts: Record<string, number> = {};
  (votes ?? []).forEach((v) => {
    voteCounts[v.clip_id] = (voteCounts[v.clip_id] ?? 0) + 1;
  });

  const myVotedClipIds = (myVotes ?? []).map((v) => v.clip_id);
  const votesRemaining = MAX_WEEKLY_VOTES - myVotedClipIds.length;

  const feedItemIds = (feedItems ?? []).map((f) => f.id);

  const feedThumbByClip: Record<string, string> = {};
  const feedToClip: Record<string, string> = {};
  (feedItems ?? []).forEach((f) => {
    if (!f.reference_id) return;
    feedToClip[f.id] = f.reference_id;
    const meta = f.metadata as Record<string, unknown> | null;
    const thumb = typeof meta?.thumbnail_url === "string" ? meta.thumbnail_url : null;
    if (thumb && !feedThumbByClip[f.reference_id]) {
      feedThumbByClip[f.reference_id] = thumb;
    }
  });

  // Batch 2: kudos, comments, profiles, myFollows, teamMembers, clipTags in parallel
  const [
    { data: kudos },
    { data: comments },
    { data: profiles },
    { data: myFollows },
    { data: teamMembers },
    { data: clipTags },
  ] = await Promise.all([
    feedItemIds.length > 0
      ? supabase.from("kudos").select("feed_item_id").in("feed_item_id", feedItemIds)
      : Promise.resolve({ data: [] }),
    feedItemIds.length > 0
      ? supabase.from("comments").select("feed_item_id").in("feed_item_id", feedItemIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, views_count, mvp_count, mvp_tier")
      .in("id", ownerIds),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", ownerIds),
    supabase
      .from("team_members")
      .select("profile_id, team_id, teams(name)")
      .in("profile_id", ownerIds)
      .neq("role", "alumni") as unknown as Promise<{ data: Array<{ profile_id: string; team_id: string; teams: { name: string } | null }> | null }>,
    supabase.from("clip_tags").select("clip_id, tag_name").in("clip_id", clipIds),
  ]);

  const kudosCounts: Record<string, number> = {};
  const commentsCounts: Record<string, number> = {};

  (kudos ?? []).forEach((k) => {
    const clipId = feedToClip[k.feed_item_id];
    if (clipId) kudosCounts[clipId] = (kudosCounts[clipId] ?? 0) + 1;
  });

  (comments ?? []).forEach((c) => {
    const clipId = feedToClip[c.feed_item_id];
    if (clipId) commentsCounts[clipId] = (commentsCounts[clipId] ?? 0) + 1;
  });

  const followingSet = new Set((myFollows ?? []).map((f) => f.following_id));

  const profileMap: Record<string, (typeof profiles extends (infer T)[] | null ? T : never)> = {};
  (profiles ?? []).forEach((p) => {
    profileMap[p.id] = p;
  });

  const teamMap: Record<string, string> = {};
  (teamMembers as Array<{ profile_id: string; team_id: string; teams: { name: string } | null }> | null ?? []).forEach((tm) => {
    if (tm.teams?.name) teamMap[tm.profile_id] = tm.teams.name;
  });

  const tagMap: Record<string, string[]> = {};
  (clipTags ?? []).forEach((ct) => {
    if (!tagMap[ct.clip_id]) tagMap[ct.clip_id] = [];
    tagMap[ct.clip_id].push(ct.tag_name);
  });

  const clipMap = new Map(clips.map((c) => [c.id, c]));

  // 6. Build ClipWithStats for scoring
  const clipsWithStats = clips.map((clip) => ({
    id: clip.id,
    owner_id: clip.owner_id,
    views_count: profileMap[clip.owner_id]?.views_count ?? 0,
    kudos_count: kudosCounts[clip.id] ?? 0,
    comments_count: commentsCounts[clip.id] ?? 0,
    profile_visits: Math.floor((profileMap[clip.owner_id]?.views_count ?? 0) * 0.3),
  }));
  const clipsWithStatsMap = new Map(clipsWithStats.map((c) => [c.id, c]));

  // 7. Rank candidates
  const ranked = rankCandidates(clipsWithStats, voteCounts);

  // 8. Build response
  const candidates = ranked.map((r, idx) => {
    const clip = clipMap.get(r.clipId);
    const profile = profileMap[r.ownerId];
    return {
      clipId: r.clipId,
      ownerId: r.ownerId,
      rank: idx + 1,
      playerName: profile?.name ?? "선수",
      playerHandle: profile?.handle ?? "",
      playerAvatarUrl: profile?.avatar_url ?? undefined,
      playerLevel: profile?.level ?? 1,
      playerPosition: profile?.position ?? null,
      teamName: teamMap[r.ownerId] ?? undefined,
      tags: tagMap[r.clipId] ?? [],
      videoUrl: clip?.video_url ?? undefined,
      thumbnailUrl: clip?.thumbnail_url ?? feedThumbByClip[r.clipId] ?? undefined,
      totalScore: r.totalScore,
      autoScore: r.autoNorm,
      voteScore: r.voteNorm,
      viewsCount: clipsWithStatsMap.get(r.clipId)?.views_count ?? 0,
      kudosCount: kudosCounts[r.clipId] ?? 0,
      voteCount: r.voteCount,
      mvpCount: profile?.mvp_count ?? 0,
      mvpTier: profile?.mvp_tier ?? null,
      isFollowing: followingSet.has(r.ownerId),
    };
  });

  // 9. Weekly stats — parallel
  const [
    { count: totalVoteCount },
    { count: newPlayerCount },
  ] = await Promise.all([
    supabase
      .from("weekly_votes")
      .select("id", { count: "exact", head: true })
      .eq("week_start", weekStart),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStartDate.toISOString()),
  ]);

  return NextResponse.json({
    candidates,
    myVotes: myVotedClipIds,
    votesRemaining,
    votingOpen: isVotingOpen(),
    weekStart,
    weeklyStats: {
      clipCount: clips.length,
      totalVotes: totalVoteCount ?? 0,
      newPlayers: newPlayerCount ?? 0,
    },
  });
}
