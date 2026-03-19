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
    const { user, supabase } = auth;

    const includeRanking = _request.nextUrl.searchParams.get("includeRanking") === "true";

    const [teamResult, memberCount, myMembership] = await Promise.all([
      supabase.from("teams").select("*").eq("id", id).single(),
      supabase.from("team_members").select("id", { count: "exact", head: true }).eq("team_id", id),
      supabase.from("team_members").select("role").eq("team_id", id).eq("profile_id", user.id).single(),
    ]);

    if (teamResult.error || !teamResult.data) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const response: Record<string, unknown> = {
      ...teamResult.data,
      memberCount: memberCount.count ?? 0,
      myRole: myMembership.data?.role ?? null,
    };

    if (includeRanking) {
      const { data: rankingData } = await supabase
        .from("team_ranking_cache")
        .select("activity_score, mvp_count")
        .eq("team_id", id)
        .maybeSingle();

      if (rankingData) {
        const { count: higherCount } = await supabase
          .from("team_ranking_cache")
          .select("team_id", { count: "exact", head: true })
          .gt("activity_score", rankingData.activity_score);

        response.ranking = {
          activity_score: rankingData.activity_score,
          mvp_count: rankingData.mvp_count,
          rank: (higherCount ?? 0) + 1,
        };
      }
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // Check admin
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("profile_id", user.id)
      .single();

    if (membership?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ["name", "handle", "description", "city", "founded_year", "logo_url"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    // Handle uniqueness check
    if (updates.handle) {
      const handle = updates.handle as string;
      if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
        return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from("teams")
        .select("id")
        .eq("handle", handle)
        .neq("id", id)
        .single();
      if (existing) {
        return NextResponse.json({ error: "Handle taken" }, { status: 409 });
      }
    }

    const { data: updated, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("profile_id", user.id)
      .single();

    if (membership?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Delete members first, then team
    await supabase.from("team_albums").delete().eq("team_id", id);
    await supabase.from("team_members").delete().eq("team_id", id);
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
