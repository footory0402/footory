import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type") ?? "all";

  if (!q || q.length < 1) {
    return NextResponse.json({ players: [], teams: [] });
  }

  const supabase = await createClient();
  const isHandleSearch = q.startsWith("@");
  const keyword = isHandleSearch ? q.slice(1) : q;
  const pattern = `%${keyword}%`;

  let players: unknown[] = [];
  let teams: unknown[] = [];

  if (type === "all" || type === "player") {
    let query = supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, city, birth_year")
      .limit(20);

    if (isHandleSearch) {
      query = query.ilike("handle", pattern);
    } else {
      query = query.or(`name.ilike.${pattern},handle.ilike.${pattern}`);
    }

    const { data } = await query;
    players = data ?? [];
  }

  if (type === "all" || type === "team") {
    const { data } = await supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, team_members(count)")
      .ilike("name", pattern)
      .limit(20);

    teams = (data ?? []).map((t) => {
      const { team_members, ...rest } = t as Record<string, unknown>;
      const members = team_members as { count: number }[] | undefined;
      return { ...rest, member_count: members?.[0]?.count ?? 0 };
    });
  }

  return NextResponse.json({ players, teams });
}
