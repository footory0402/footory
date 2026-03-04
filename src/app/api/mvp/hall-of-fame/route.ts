import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);

  // Get profiles with mvp_count > 0, ordered by mvp_count desc
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, level, mvp_count, mvp_tier")
    .gt("mvp_count", 0)
    .order("mvp_count", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  // Get team names
  const profileIds = profiles.map((p) => p.id);
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("profile_id, teams(name)")
    .in("profile_id", profileIds)
    .neq("role", "alumni") as { data: Array<{ profile_id: string; teams: { name: string } | null }> | null };

  const teamMap: Record<string, string> = {};
  (teamMembers ?? []).forEach((tm) => {
    if (tm.teams?.name) teamMap[tm.profile_id] = tm.teams.name;
  });

  const entries = profiles.map((p) => ({
    profileId: p.id,
    playerName: p.name,
    playerHandle: p.handle,
    playerAvatarUrl: p.avatar_url ?? undefined,
    playerLevel: p.level,
    playerPosition: p.position,
    teamName: teamMap[p.id] ?? undefined,
    mvpCount: p.mvp_count,
    mvpTier: p.mvp_tier,
  }));

  return NextResponse.json({ entries });
}
