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
    const query = supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, city, birth_year")
      .limit(20);

    if (isHandleSearch) {
      query.ilike("handle", pattern);
    } else {
      query.or(`name.ilike.${pattern},handle.ilike.${pattern}`);
    }

    const { data } = await query;
    players = data ?? [];
  }

  if (type === "all" || type === "team") {
    const { data } = await supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, member_count")
      .ilike("name", pattern)
      .limit(20);

    teams = data ?? [];
  }

  return NextResponse.json({ players, teams });
}
