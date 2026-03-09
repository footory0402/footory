import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, rankCandidates, getMvpTier } from "@/lib/mvp-scoring";

export async function POST(request: NextRequest) {
  // Authenticate via CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Calculate last week's start (current week start - 7 days)
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStart = getWeekStart(lastWeek);
  const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
  const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Check if already finalized
  const { data: existing } = await supabase
    .from("weekly_mvp_results")
    .select("id")
    .eq("week_start", weekStart)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: "Already finalized", weekStart });
  }

  // Fetch clips from that week
  const { data: clips } = await supabase
    .from("clips")
    .select("id, owner_id, video_url, thumbnail_url, created_at")
    .gte("created_at", weekStartDate.toISOString())
    .lt("created_at", weekEndDate.toISOString());

  if (!clips?.length) {
    return NextResponse.json({ message: "No clips for week", weekStart });
  }

  const clipIds = clips.map((c) => c.id);
  const ownerIds = [...new Set(clips.map((c) => c.owner_id))];

  // Fetch votes and engagement data
  const [{ data: votes }, { data: feedItems }, { data: profiles }] = await Promise.all([
    supabase
      .from("weekly_votes")
      .select("clip_id")
      .eq("week_start", weekStart)
      .in("clip_id", clipIds),
    supabase
      .from("feed_items")
      .select("reference_id, kudos(count), comments(count)")
      .eq("type", "highlight")
      .in("reference_id", clipIds) as unknown as Promise<{
      data: Array<{
        reference_id: string | null;
        kudos: { count: number }[];
        comments: { count: number }[];
      }> | null;
    }>,
    supabase
      .from("profiles")
      .select("id, handle, name, views_count, mvp_count")
      .in("id", ownerIds),
  ]);

  // Count votes per clip
  const voteCounts: Record<string, number> = {};
  for (const vote of votes ?? []) {
    voteCounts[vote.clip_id] = (voteCounts[vote.clip_id] ?? 0) + 1;
  }

  // Count kudos/comments per clip
  const kudosCounts: Record<string, number> = {};
  const commentsCounts: Record<string, number> = {};
  for (const item of feedItems ?? []) {
    if (!item.reference_id) continue;
    kudosCounts[item.reference_id] = (kudosCounts[item.reference_id] ?? 0) + (item.kudos?.[0]?.count ?? 0);
    commentsCounts[item.reference_id] = (commentsCounts[item.reference_id] ?? 0) + (item.comments?.[0]?.count ?? 0);
  }

  const profileMap: Record<string, { id: string; handle: string; name: string; views_count: number; mvp_count: number }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }

  // Build clips with stats
  const clipsWithStats = clips.map((clip) => ({
    id: clip.id,
    owner_id: clip.owner_id,
    views_count: profileMap[clip.owner_id]?.views_count ?? 0,
    kudos_count: kudosCounts[clip.id] ?? 0,
    comments_count: commentsCounts[clip.id] ?? 0,
  }));

  // Rank candidates
  const ranked = rankCandidates(clipsWithStats, voteCounts);
  const top10 = ranked.slice(0, 10);

  // Insert weekly_mvp_results
  const results = top10.map((r, i) => ({
    week_start: weekStart,
    rank: i + 1,
    clip_id: r.clipId,
    profile_id: r.ownerId,
    auto_score: r.autoNorm,
    vote_score: r.voteNorm,
    total_score: r.totalScore,
    vote_count: r.voteCount,
  }));

  const { error: insertError } = await supabase
    .from("weekly_mvp_results")
    .insert(results);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update 1st place: increment mvp_count, update mvp_tier
  if (top10.length > 0) {
    const winner = top10[0];
    const currentCount = profileMap[winner.ownerId]?.mvp_count ?? 0;
    const newCount = currentCount + 1;
    const newTier = getMvpTier(newCount);

    await supabase
      .from("profiles")
      .update({ mvp_count: newCount, mvp_tier: newTier })
      .eq("id", winner.ownerId);

    // Create feed item for MVP win
    await supabase.from("feed_items").insert({
      profile_id: winner.ownerId,
      type: "mvp_win" as never,
      reference_id: winner.clipId,
      metadata: {
        week_start: weekStart,
        rank: 1,
        total_score: winner.totalScore,
      },
    });

    // Send notification to winner
    await supabase.from("notifications").insert({
      user_id: winner.ownerId,
      type: "mvp_win",
      title: "이번 주 MVP로 선정되었습니다!",
      body: `축하합니다! ${weekStart} 주간 MVP 1위를 차지했습니다.`,
      action_url: "/mvp",
    });
  }

  return NextResponse.json({
    message: "Finalized",
    weekStart,
    resultsCount: top10.length,
    winner: top10[0]?.ownerId ?? null,
  });
}
