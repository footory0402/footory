import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 20);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .select("id, handle, name, logo_url, city, team_members(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Flatten member count
  const teams = (data ?? []).map((t) => {
    const { team_members, ...rest } = t as Record<string, unknown>;
    const members = team_members as { count: number }[] | undefined;
    return { ...rest, member_count: members?.[0]?.count ?? 0 };
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teams });
}
