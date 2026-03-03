import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [members, albums] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, team_id, profile_id, role, joined_at, profiles(id, handle, name, avatar_url, position, level)")
      .eq("team_id", team.id)
      .order("joined_at"),
    supabase
      .from("team_albums")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    ...team,
    members: members.data ?? [],
    albums: albums.data ?? [],
  });
}
