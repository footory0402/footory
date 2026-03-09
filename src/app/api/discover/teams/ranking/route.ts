import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface TeamRankingRow {
  team_id: string;
  activity_score: number;
  mvp_count: number | null;
}

interface TeamRow {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  team_members?: { count: number }[];
}

interface TeamRankingItem {
  team_id: string;
  activity_score: number;
  mvp_count: number;
  handle: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  member_count: number;
  clip_count: number;
}

async function fetchTeams(
  supabase: SupabaseServerClient,
  teamIds: string[]
) {
  if (teamIds.length === 0) return [] as TeamRow[];

  const { data, error } = await supabase
    .from("teams")
    .select("id, handle, name, logo_url, city, team_members(count)")
    .in("id", teamIds);

  if (error) throw error;
  return (data ?? []) as unknown as TeamRow[];
}

function toTeamItem(
  team: TeamRow,
  overrides?: Partial<Pick<TeamRankingItem, "activity_score" | "mvp_count">>
): TeamRankingItem {
  return {
    team_id: team.id,
    activity_score: overrides?.activity_score ?? 0,
    mvp_count: overrides?.mvp_count ?? 0,
    handle: team.handle,
    name: team.name,
    logo_url: team.logo_url,
    city: team.city,
    member_count: team.team_members?.[0]?.count ?? 0,
    clip_count: 0,
  };
}

function sortItems(items: TeamRankingItem[]) {
  return [...items].sort((a, b) => {
    if (b.activity_score !== a.activity_score) {
      return b.activity_score - a.activity_score;
    }
    if (b.member_count !== a.member_count) {
      return b.member_count - a.member_count;
    }
    return a.name.localeCompare(b.name, "ko");
  });
}

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 100);

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

  try {
    const cachedRows = (rankingData ?? []) as TeamRankingRow[];
    const cachedTeamIds = cachedRows.map((row) => row.team_id);
    const cachedTeams = await fetchTeams(supabase, cachedTeamIds);
    const cachedTeamMap = new Map(cachedTeams.map((team) => [team.id, team]));

    const cachedItems: TeamRankingItem[] = cachedRows.flatMap((row) => {
      const team = cachedTeamMap.get(row.team_id);
      if (!team) return [];
      return [toTeamItem(team, { activity_score: row.activity_score, mvp_count: row.mvp_count ?? 0 })];
    });

    const remaining = Math.max(0, limit - cachedItems.length);
    let fallbackItems: TeamRankingItem[] = [];

    if (remaining > 0) {
      let fallbackQuery = supabase
        .from("teams")
        .select("id, handle, name, logo_url, city, team_members(count)")
        .order("created_at", { ascending: false });

      const cachedItemIds = cachedItems.map((item) => item.team_id);
      if (cachedItemIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${cachedItemIds.join(",")})`);
      }

      const { data: fallbackTeams, error: fallbackError } = await fallbackQuery.limit(remaining);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      fallbackItems = ((fallbackTeams ?? []) as unknown as TeamRow[]).map((team) => toTeamItem(team));
    }

    const items = sortItems([...cachedItems, ...fallbackItems]).slice(0, limit);

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch team ranking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
