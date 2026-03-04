import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get teams where user is a member
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, handle, name, logo_url, description, city, founded_year, invite_code, created_by, created_at, team_members(count))")
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const teams = (memberships ?? []).map((m) => {
    const team = m.teams as unknown as Record<string, unknown> & { team_members?: { count: number }[] };
    const members = team.team_members;
    const { team_members, ...rest } = team;
    return {
      ...rest,
      memberCount: members?.[0]?.count ?? 0,
      myRole: m.role,
    };
  });

  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, handle, description, city, founded_year } = body;

  if (!name || !handle) {
    return NextResponse.json({ error: "Name and handle are required" }, { status: 400 });
  }

  // Input length validation
  if ((typeof name === "string" && name.length > 50) ||
      (typeof description === "string" && description.length > 200)) {
    return NextResponse.json({ error: "입력값이 너무 깁니다" }, { status: 400 });
  }

  // Handle validation
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
  }

  // Check handle uniqueness
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("handle", handle)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Handle taken" }, { status: 409 });
  }

  const invite_code = generateInviteCode();

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name,
      handle,
      description: description || null,
      city: city || null,
      founded_year: founded_year || null,
      invite_code,
      created_by: user.id,
    })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      profile_id: user.id,
      role: "admin",
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ ...team, memberCount: 1, myRole: "admin" }, { status: 201 });
}
