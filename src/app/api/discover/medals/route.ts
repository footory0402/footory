import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 20);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("medals")
    .select("*, profiles!medals_player_id_fkey(id, handle, name, avatar_url, position, level)")
    .order("awarded_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ medals: data ?? [] });
}
