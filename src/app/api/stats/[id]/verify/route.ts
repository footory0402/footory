import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a team admin of the stat owner's team
  const { data: stat } = await supabase
    .from("stats")
    .select("profile_id")
    .eq("id", id)
    .single();

  if (!stat) {
    return NextResponse.json({ error: "Stat not found" }, { status: 404 });
  }

  // Verify that the current user is a team admin of the stat owner
  const { data: ownerTeam } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", stat.profile_id)
    .limit(1)
    .single();

  if (!ownerTeam) {
    return NextResponse.json({ error: "Player has no team" }, { status: 400 });
  }

  const { data: adminCheck } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", ownerTeam.team_id)
    .eq("profile_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: "Not authorized to verify" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("stats")
    .update({
      verified: true,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stat: updated });
}
