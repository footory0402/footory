import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PlayerSortKey = "popularity" | "followers" | "mvp";
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface RankingRow {
  profile_id: string;
  popularity_score: number;
  weekly_change: number | null;
}

interface ProfileRow {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  level: number | null;
  followers_count: number | null;
  mvp_count: number | null;
  mvp_tier: string | null;
  role?: string | null;
}

interface SeasonRow {
  profile_id: string;
  team_name: string | null;
}

interface PlayerRankingItem {
  profile_id: string;
  popularity_score: number;
  weekly_change: number;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
  team_name: string | null;
  mvp_count: number;
  mvp_tier: string | null;
  followers_count: number;
  kudos_count: number;
}

async function fetchProfiles(
  supabase: SupabaseServerClient,
  profileIds: string[],
  includeRole = false
) {
  if (profileIds.length === 0) return [] as ProfileRow[];

  const select = includeRole
    ? "id, handle, name, avatar_url, position, level, followers_count, mvp_count, mvp_tier, role"
    : "id, handle, name, avatar_url, position, level, followers_count, mvp_count, mvp_tier";
  const { data, error } = await supabase.from("profiles").select(select).in("id", profileIds);

  if (error) throw error;
  return (data ?? []) as unknown as ProfileRow[];
}

async function fetchCurrentTeamNames(
  supabase: SupabaseServerClient,
  profileIds: string[]
) {
  if (profileIds.length === 0) return new Map<string, string>();

  const { data, error } = await supabase
    .from("seasons")
    .select("profile_id, team_name")
    .in("profile_id", profileIds)
    .eq("is_current", true);

  if (error) throw error;

  return new Map(
    ((data ?? []) as unknown as SeasonRow[])
      .filter((season) => season.team_name)
      .map((season) => [season.profile_id, season.team_name as string])
  );
}

function sortItems(items: PlayerRankingItem[], sort: PlayerSortKey) {
  return [...items].sort((a, b) => {
    if (sort === "followers") {
      if (b.followers_count !== a.followers_count) {
        return b.followers_count - a.followers_count;
      }
    } else if (sort === "mvp") {
      if (b.mvp_count !== a.mvp_count) {
        return b.mvp_count - a.mvp_count;
      }
      if (b.followers_count !== a.followers_count) {
        return b.followers_count - a.followers_count;
      }
    } else if (b.popularity_score !== a.popularity_score) {
      return b.popularity_score - a.popularity_score;
    }

    if (b.weekly_change !== a.weekly_change) {
      return b.weekly_change - a.weekly_change;
    }

    return b.followers_count - a.followers_count;
  });
}

export async function GET(req: NextRequest) {
  const sort = (req.nextUrl.searchParams.get("sort") ?? "popularity") as PlayerSortKey;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 100);

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

  try {
    const cachedRows = (rankingData ?? []) as RankingRow[];
    const cachedProfileIds = cachedRows.map((row) => row.profile_id);

    const [cachedProfiles, cachedTeamNames] = await Promise.all([
      fetchProfiles(supabase, cachedProfileIds, true),
      fetchCurrentTeamNames(supabase, cachedProfileIds),
    ]);

    const cachedProfileMap = new Map(
      cachedProfiles
        .filter((profile) => profile.role === "player")
        .map((profile) => [profile.id, profile])
    );

    const cachedItems: PlayerRankingItem[] = cachedRows.flatMap((row) => {
      const profile = cachedProfileMap.get(row.profile_id);
      if (!profile) return [];

      return [
        {
          profile_id: row.profile_id,
          popularity_score: row.popularity_score,
          weekly_change: row.weekly_change ?? 0,
          handle: profile.handle,
          name: profile.name,
          avatar_url: profile.avatar_url,
          position: profile.position,
          level: profile.level ?? 1,
          team_name: cachedTeamNames.get(row.profile_id) ?? null,
          mvp_count: profile.mvp_count ?? 0,
          mvp_tier: profile.mvp_tier ?? null,
          followers_count: profile.followers_count ?? 0,
          kudos_count: 0,
        },
      ];
    });

    const remaining = Math.max(0, limit - cachedItems.length);
    let fallbackItems: PlayerRankingItem[] = [];

    if (remaining > 0) {
      let fallbackQuery = supabase
        .from("profiles")
        .select("id, handle, name, avatar_url, position, level, followers_count, mvp_count, mvp_tier")
        .eq("role", "player");

      const cachedItemIds = cachedItems.map((item) => item.profile_id);
      if (cachedItemIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${cachedItemIds.join(",")})`);
      }

      if (sort === "mvp") {
        fallbackQuery = fallbackQuery
          .order("mvp_count", { ascending: false })
          .order("followers_count", { ascending: false });
      } else {
        fallbackQuery = fallbackQuery.order("followers_count", { ascending: false });
      }

      const { data: fallbackProfiles, error: fallbackError } = await fallbackQuery.limit(remaining);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      const fallbackProfileRows = (fallbackProfiles ?? []) as unknown as ProfileRow[];
      const fallbackTeamNames = await fetchCurrentTeamNames(
        supabase,
        fallbackProfileRows.map((profile) => profile.id)
      );

      fallbackItems = fallbackProfileRows.map((profile) => ({
        profile_id: profile.id,
        popularity_score: profile.followers_count ?? 0,
        weekly_change: 0,
        handle: profile.handle,
        name: profile.name,
        avatar_url: profile.avatar_url,
        position: profile.position,
        level: profile.level ?? 1,
        team_name: fallbackTeamNames.get(profile.id) ?? null,
        mvp_count: profile.mvp_count ?? 0,
        mvp_tier: profile.mvp_tier ?? null,
        followers_count: profile.followers_count ?? 0,
        kudos_count: 0,
      }));
    }

    const items = sortItems([...cachedItems, ...fallbackItems], sort).slice(0, limit);

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch player ranking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
