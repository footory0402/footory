import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// GET: List child's seasons
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id: childId } = await params;

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const { data: seasons, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("profile_id", childId)
      .order("year", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ seasons: seasons ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add season for child
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id: childId } = await params;

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const body = await request.json();
    const { year, teamName, league, isNewTeam } = body;

    if (!year || !teamName) {
      return NextResponse.json({ error: "year and teamName are required" }, { status: 400 });
    }

    if (isNewTeam) {
      await supabase
        .from("seasons")
        .update({ is_current: false })
        .eq("profile_id", childId)
        .eq("is_current", true);
    }

    const { data: season, error } = await supabase
      .from("seasons")
      .insert({
        profile_id: childId,
        year,
        team_name: teamName,
        league: league ?? null,
        is_current: true,
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

// DELETE: Delete a season
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id: childId } = await params;

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");
    if (!seasonId) {
      return NextResponse.json({ error: "seasonId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("seasons")
      .delete()
      .eq("id", seasonId)
      .eq("profile_id", childId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
