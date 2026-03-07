import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/parent/dashboard?childId=<uuid>
// Returns aggregated dashboard data for a linked child
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify parent role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "parent") {
      return NextResponse.json({ error: "Parent role required" }, { status: 403 });
    }

    const childId = req.nextUrl.searchParams.get("childId");
    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    // Verify link
    const { data: link, error: linkError } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .maybeSingle();

    if (linkError || !link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    // Get current week boundaries (Mon 00:00 ~ Sun 23:59)
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Mon=0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    // Fetch all data in parallel — each query wrapped to prevent single failure from crashing all
    const [childProfile, weeklyClips, weeklyKudos, weeklyViews, mvpResult, recentActivity, teamNews] =
      await Promise.all([
        Promise.resolve(
          supabase
            .from("profiles")
            .select("id, name, handle, avatar_url, position, level, xp, followers_count, views_count")
            .eq("id", childId)
            .maybeSingle()
        ).catch(() => ({ data: null, error: null })),
        Promise.resolve(
          supabase
            .from("clips")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", childId)
            .gte("created_at", weekStartISO)
        ).catch(() => ({ count: 0 })),
        (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ data: number }> })
          .rpc("count_weekly_kudos", { p_profile_id: childId, p_week_start: weekStartISO })
          .catch(() => ({ data: 0 })),
        Promise.resolve(
          supabase
            .from("profiles")
            .select("views_count")
            .eq("id", childId)
            .maybeSingle()
        ).catch(() => ({ data: null })),
        Promise.resolve(
          supabase
            .from("weekly_mvp_results")
            .select("rank, total_score")
            .eq("profile_id", childId)
            .gte("week_start", weekStartISO)
            .order("rank", { ascending: true })
            .limit(1)
            .maybeSingle()
        ).catch(() => ({ data: null })),
        Promise.resolve(
          supabase
            .from("feed_items")
            .select("id, type, metadata, created_at")
            .eq("profile_id", childId)
            .order("created_at", { ascending: false })
            .limit(5)
        ).catch(() => ({ data: [] as { id: string; type: string; metadata: unknown; created_at: string }[] })),
        getTeamNews(supabase, childId).catch(() => []),
      ]);

    return NextResponse.json({
      parentName: profile.name,
      child: childProfile.data,
      weeklyStats: {
        newClips: weeklyClips.count ?? 0,
        kudosReceived: typeof weeklyKudos.data === "number" ? weeklyKudos.data : 0,
        profileViews: weeklyViews.data?.views_count ?? 0,
        mvpRank: mvpResult.data?.rank ?? null,
        level: childProfile.data?.level ?? 1,
      },
      recentActivity: ((recentActivity as { data?: { id: string; type: string; metadata: unknown; created_at: string }[] }).data ?? []).map((item) => ({
        id: item.id,
        type: item.type,
        metadata: item.metadata,
        createdAt: item.created_at,
      })),
      teamNews,
    });
  } catch (error) {
    console.error("parent dashboard failed", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

async function getTeamNews(supabase: Awaited<ReturnType<typeof createClient>>, childId: string) {
  // Get child's current team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("profile_id", childId)
    .neq("role", "alumni")
    .limit(1)
    .maybeSingle();

  if (!membership) return [];

  // Get recent team activity
  const teamId = membership.team_id;
  const teamName = (membership as unknown as { teams: { name: string } }).teams?.name ?? "팀";

  const memberIds = (
    await supabase
      .from("team_members")
      .select("profile_id")
      .eq("team_id", teamId)
      .neq("role", "alumni")
  ).data?.map((m) => m.profile_id) ?? [];

  if (memberIds.length === 0) return [];

  const { count: teamClipCount } = await supabase
    .from("clips")
    .select("id", { count: "exact", head: true })
    .in("owner_id", memberIds)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return [
    {
      teamId,
      teamName,
      newClips: teamClipCount ?? 0,
    },
  ];
}
