import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [highlightsRes, playersRes, teamsRes] = await Promise.all([
    supabase
      .from("feed_items")
      .select("*, profiles!feed_items_profile_id_fkey(id, handle, name, avatar_url, position, level)")
      .eq("type", "highlight")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, city, birth_year")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, team_members(count)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const teams = (teamsRes.data ?? []).map((t) => {
    const { team_members, ...rest } = t as Record<string, unknown>;
    const members = team_members as { count: number }[] | undefined;
    return { ...rest, member_count: members?.[0]?.count ?? 0 };
  });

  if (highlightsRes.error || playersRes.error || teamsRes.error) {
    const error =
      highlightsRes.error ??
      playersRes.error ??
      teamsRes.error;
    return NextResponse.json({ error: error?.message ?? "Failed to fetch discover data" }, { status: 500 });
  }

  return NextResponse.json(
    {
      highlights: highlightsRes.data ?? [],
      players: playersRes.data ?? [],
      teams,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
