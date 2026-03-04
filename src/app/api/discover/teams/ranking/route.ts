import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 50);

  const supabase = await createClient();

  // Try ranking cache first
  const { data: rankingData, error: rankingError } = await supabase
    .from("team_ranking_cache")
    .select("team_id, activity_score, mvp_count")
    .order("activity_score", { ascending: false })
    .limit(limit);

  if (rankingError) {
    return NextResponse.json({ error: rankingError.message }, { status: 500 });
  }

  if (!rankingData || rankingData.length === 0) {
    // Fallback: return teams sorted by member count
    const { data: fallbackTeams, error: fallbackError } = await supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, team_members(count)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    const items = (fallbackTeams ?? []).map((t) => {
      const { team_members, ...rest } = t as Record<string, unknown>;
      const members = team_members as { count: number }[] | undefined;
      return {
        team_id: rest.id as string,
        activity_score: 0,
        mvp_count: 0,
        handle: rest.handle as string,
        name: rest.name as string,
        logo_url: (rest.logo_url as string | null) ?? null,
        city: (rest.city as string | null) ?? null,
        member_count: members?.[0]?.count ?? 0,
        clip_count: 0,
      };
    });

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  // Fetch team details
  const teamIds = rankingData.map((r) => r.team_id);
  const { data: teams } = await supabase
    .from("teams")
    .select("id, handle, name, logo_url, city, team_members(count)")
    .in("id", teamIds);

  const teamMap = new Map(
    (teams ?? []).map((t) => {
      const { team_members, ...rest } = t as Record<string, unknown>;
      const members = team_members as { count: number }[] | undefined;
      return [
        rest.id as string,
        { ...rest, member_count: members?.[0]?.count ?? 0 },
      ];
    })
  );

  const items = rankingData.map((r) => {
    const t = teamMap.get(r.team_id) as Record<string, unknown> | undefined;
    return {
      team_id: r.team_id,
      activity_score: r.activity_score,
      mvp_count: r.mvp_count,
      handle: (t?.handle as string) ?? "",
      name: (t?.name as string) ?? "",
      logo_url: (t?.logo_url as string | null) ?? null,
      city: (t?.city as string | null) ?? null,
      member_count: (t?.member_count as number) ?? 0,
      clip_count: 0,
    };
  });

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
