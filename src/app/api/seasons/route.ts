import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data: seasons, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("profile_id", user.id)
    .order("year", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seasons: seasons ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await request.json();
  const { year, teamName, teamId, league, isNewTeam } = body;

  if (!year || !teamName) {
    return NextResponse.json({ error: "year and teamName are required" }, { status: 400 });
  }

  // If moving to a new team, mark all previous seasons as not current
  // and update previous team membership to alumni
  if (isNewTeam) {
    await supabase
      .from("seasons")
      .update({ is_current: false })
      .eq("profile_id", user.id)
      .eq("is_current", true);

    // Mark previous team memberships as alumni
    if (teamId) {
      // Get current team memberships (not the new one)
      const { data: currentMemberships } = await supabase
        .from("team_members")
        .select("id, team_id")
        .eq("profile_id", user.id)
        .eq("role", "member");

      if (currentMemberships) {
        for (const m of currentMemberships) {
          if (m.team_id !== teamId) {
            await supabase
              .from("team_members")
              .update({ role: "alumni" })
              .eq("id", m.id);
          }
        }
      }
    }
  }

  const { data: season, error } = await supabase
    .from("seasons")
    .insert({
      profile_id: user.id,
      year,
      team_name: teamName,
      team_id: teamId ?? null,
      is_current: true,
      league: league ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ season }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
