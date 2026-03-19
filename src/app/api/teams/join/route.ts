import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { invite_code } = await request.json();

    if (!invite_code) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find team by invite code
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("invite_code", invite_code.toUpperCase())
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("profile_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    // Join as member
    const { error: joinError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        profile_id: user.id,
        role: "member",
      });

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    return NextResponse.json({ teamId: team.id, teamName: team.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
