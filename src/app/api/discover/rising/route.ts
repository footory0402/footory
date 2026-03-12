import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface RisingRow {
  profile_id: string;
  weekly_change: number | null;
}

interface ProfileRow {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  role?: string | null;
}

interface RisingItem {
  profile_id: string;
  weekly_change: number;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
}

async function fetchProfiles(
  supabase: SupabaseServerClient,
  profileIds: string[],
  includeRole = false
) {
  if (profileIds.length === 0) return [] as ProfileRow[];

  const select = includeRole
    ? "id, handle, name, avatar_url, position, role"
    : "id, handle, name, avatar_url, position";
  const { data, error } = await supabase.from("profiles").select(select).in("id", profileIds);

  if (error) throw error;
  return (data ?? []) as unknown as ProfileRow[];
}

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 100);

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

  try {
    const cachedRows = (risingData ?? []) as RisingRow[];
    const cachedProfileIds = cachedRows.map((row) => row.profile_id);
    const cachedProfiles = await fetchProfiles(supabase, cachedProfileIds, true);
    const cachedProfileMap = new Map(
      cachedProfiles
        .filter((profile) => profile.role === "player")
        .map((profile) => [profile.id, profile])
    );

    const cachedItems: RisingItem[] = cachedRows.flatMap((row) => {
      const profile = cachedProfileMap.get(row.profile_id);
      if (!profile) return [];

      return [
        {
          profile_id: row.profile_id,
          weekly_change: row.weekly_change ?? 0,
          handle: profile.handle,
          name: profile.name,
          avatar_url: profile.avatar_url,
          position: profile.position,
        },
      ];
    });

    const remaining = Math.max(0, limit - cachedItems.length);
    let fallbackItems: RisingItem[] = [];

    if (remaining > 0) {
      let fallbackQuery = supabase
        .from("profiles")
        .select("id, handle, name, avatar_url, position, level")
        .eq("role", "player")
        .order("updated_at", { ascending: false });

      const cachedItemIds = cachedItems.map((item) => item.profile_id);
      if (cachedItemIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${cachedItemIds.join(",")})`);
      }

      const { data: fallbackProfiles, error: fallbackError } = await fallbackQuery.limit(remaining);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      fallbackItems = ((fallbackProfiles ?? []) as unknown as ProfileRow[]).map((profile) => ({
        profile_id: profile.id,
        weekly_change: 0,
        handle: profile.handle,
        name: profile.name,
        avatar_url: profile.avatar_url,
        position: profile.position,
      }));
    }

    const items = [...cachedItems, ...fallbackItems].slice(0, limit);

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch rising players";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
