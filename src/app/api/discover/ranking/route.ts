import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") ?? "popularity";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 50);

  const supabase = await createClient();

  // Fetch ranking cache joined with profiles
  const { data: rankingData, error: rankingError } = await supabase
    .from("player_ranking_cache")
    .select("profile_id, popularity_score, weekly_change")
    .order("popularity_score", { ascending: false })
    .limit(limit);

  if (rankingError) {
    return NextResponse.json({ error: rankingError.message }, { status: 500 });
  }

  if (!rankingData || rankingData.length === 0) {
    // Fallback: return profiles sorted by followers_count if no cache data
    const { data: fallbackProfiles, error: fallbackError } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, followers_count, mvp_count, mvp_tier")
      .order("followers_count", { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    const items = (fallbackProfiles ?? []).map((p) => ({
      profile_id: p.id,
      popularity_score: p.followers_count ?? 0,
      weekly_change: 0,
      handle: p.handle,
      name: p.name,
      avatar_url: p.avatar_url,
      position: p.position,
      level: p.level ?? 1,
      team_name: null,
      mvp_count: p.mvp_count ?? 0,
      mvp_tier: p.mvp_tier,
      followers_count: p.followers_count ?? 0,
      kudos_count: 0,
    }));

    // Sort based on requested key
    if (sort === "followers") {
      items.sort((a, b) => b.followers_count - a.followers_count);
    } else if (sort === "mvp") {
      items.sort((a, b) => b.mvp_count - a.mvp_count);
    }

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  // Fetch profile details for ranked players
  const profileIds = rankingData.map((r) => r.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, level, followers_count, mvp_count, mvp_tier")
    .in("id", profileIds);

  // Get team names via current seasons
  const { data: seasons } = await supabase
    .from("seasons")
    .select("profile_id, team_name")
    .in("profile_id", profileIds)
    .eq("is_current", true);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const seasonMap = new Map((seasons ?? []).map((s) => [s.profile_id, s.team_name]));

  const items = rankingData.map((r) => {
    const p = profileMap.get(r.profile_id);
    return {
      profile_id: r.profile_id,
      popularity_score: r.popularity_score,
      weekly_change: r.weekly_change,
      handle: p?.handle ?? "",
      name: p?.name ?? "",
      avatar_url: p?.avatar_url ?? null,
      position: p?.position ?? null,
      level: p?.level ?? 1,
      team_name: seasonMap.get(r.profile_id) ?? null,
      mvp_count: p?.mvp_count ?? 0,
      mvp_tier: p?.mvp_tier ?? null,
      followers_count: p?.followers_count ?? 0,
      kudos_count: 0,
    };
  });

  // Sort based on requested key
  if (sort === "followers") {
    items.sort((a, b) => b.followers_count - a.followers_count);
  } else if (sort === "mvp") {
    items.sort((a, b) => b.mvp_count - a.mvp_count);
  }

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
