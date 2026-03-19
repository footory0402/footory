import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const { data: members, error } = await supabase
      .from("team_members")
      .select("id, team_id, profile_id, role, joined_at, profiles(id, handle, name, avatar_url, position, level)")
      .eq("team_id", id)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(members ?? []);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");
    const targetId = profileId || user.id;

    // If removing someone else, must be admin
    if (targetId !== user.id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", id)
        .eq("profile_id", user.id)
        .single();

      if (membership?.role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", id)
      .eq("profile_id", targetId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
