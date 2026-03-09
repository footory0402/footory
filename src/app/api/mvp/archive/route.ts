import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeMediaUrl } from "@/lib/media-url";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10);

  // Get past MVP results ordered by week, then by rank
  const { data: results, error } = await supabase
    .from("weekly_mvp_results")
    .select("*")
    .order("week_start", { ascending: false })
    .order("rank", { ascending: true })
    .limit(limit * 3); // 3 results per week, limit weeks

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!results || results.length === 0) {
    return NextResponse.json({ weeks: [] });
  }

  // Collect profile IDs and clip IDs
  const profileIds = [...new Set(results.map((r) => r.profile_id))];
  const clipIds = [...new Set(results.map((r) => r.clip_id))];

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, level, mvp_count, mvp_tier")
    .in("id", profileIds);

  const profileMap: Record<string, (typeof profiles extends (infer T)[] | null ? T : never)> = {};
  (profiles ?? []).forEach((p) => {
    profileMap[p.id] = p;
  });

  // Fetch clip thumbnails
  const { data: clips } = await supabase
    .from("clips")
    .select("id, thumbnail_url")
    .in("id", clipIds);

  const clipMap: Record<string, string | null> = {};
  (clips ?? []).forEach((c) => {
    clipMap[c.id] = normalizeMediaUrl(c.thumbnail_url);
  });

  // Fetch team names
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("profile_id, teams(name)")
    .in("profile_id", profileIds)
    .neq("role", "alumni") as { data: Array<{ profile_id: string; teams: { name: string } | null }> | null };

  const teamMap: Record<string, string> = {};
  (teamMembers ?? []).forEach((tm) => {
    if (tm.teams?.name) teamMap[tm.profile_id] = tm.teams.name;
  });

  // Group by week
  const weekMap = new Map<string, typeof results>();
  results.forEach((r) => {
    const ws = r.week_start;
    if (!weekMap.has(ws)) weekMap.set(ws, []);
    weekMap.get(ws)!.push(r);
  });

  const weeks = Array.from(weekMap.entries()).map(([weekStart, weekResults]) => ({
    weekStart,
    results: weekResults.map((r) => {
      const profile = profileMap[r.profile_id];
      return {
        rank: r.rank,
        profileId: r.profile_id,
        playerName: profile?.name ?? "선수",
        playerHandle: profile?.handle ?? "",
        playerAvatarUrl: profile?.avatar_url ?? undefined,
        playerLevel: profile?.level ?? 1,
        playerPosition: profile?.position ?? null,
        teamName: teamMap[r.profile_id] ?? undefined,
        thumbnailUrl: clipMap[r.clip_id] ?? undefined,
        totalScore: r.total_score,
        voteCount: r.vote_count,
        mvpCount: profile?.mvp_count ?? 0,
        mvpTier: profile?.mvp_tier ?? null,
      };
    }),
  }));

  return NextResponse.json({ weeks });
}
