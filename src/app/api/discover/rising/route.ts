import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 20);

  const supabase = await createClient();

  // Fetch players with highest weekly_change from ranking cache
  const { data: risingData, error: risingError } = await supabase
    .from("player_ranking_cache")
    .select("profile_id, weekly_change")
    .gt("weekly_change", 0)
    .order("weekly_change", { ascending: false })
    .limit(limit);

  if (risingError) {
    return NextResponse.json({ error: risingError.message }, { status: 500 });
  }

  if (!risingData || risingData.length === 0) {
    // Fallback: return recently active profiles
    const { data: fallbackProfiles, error: fallbackError } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    const items = (fallbackProfiles ?? []).map((p) => ({
      profile_id: p.id,
      weekly_change: 0,
      handle: p.handle,
      name: p.name,
      avatar_url: p.avatar_url,
      position: p.position,
      level: p.level ?? 1,
    }));

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  // Fetch profile details
  const profileIds = risingData.map((r) => r.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, level")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const items = risingData.map((r) => {
    const p = profileMap.get(r.profile_id);
    return {
      profile_id: r.profile_id,
      weekly_change: r.weekly_change,
      handle: p?.handle ?? "",
      name: p?.name ?? "",
      avatar_url: p?.avatar_url ?? null,
      position: p?.position ?? null,
      level: p?.level ?? 1,
    };
  });

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
