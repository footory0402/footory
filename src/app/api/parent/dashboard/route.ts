import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth-guard";

type QueryResult<T> = {
  data: T | null;
  error?: { message?: string } | null;
  count?: number | null;
};

// GET /api/parent/dashboard?childId=<uuid>
// Returns aggregated dashboard data for a linked child
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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

    // Previous week boundaries
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartISO = prevWeekStart.toISOString();
    const [
      childProfileResult,
      weeklyClipsResult,
      weeklyKudosResult,
      weeklyViewsResult,
      mvpResultResult,
      recentActivityResult,
      teamNewsResult,
      prevWeeklyClipsResult,
      prevWeeklyKudosResult,
    ] = await Promise.allSettled([
      supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, position, level, xp, followers_count, views_count")
        .eq("id", childId)
        .maybeSingle(),
      supabase
        .from("clips")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", childId)
        .gte("created_at", weekStartISO),
      (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ data: number | null }> })
        .rpc("count_weekly_kudos", { p_profile_id: childId, p_week_start: weekStartISO }),
      supabase
        .from("profiles")
        .select("views_count")
        .eq("id", childId)
        .maybeSingle(),
      supabase
        .from("weekly_mvp_results")
        .select("rank, total_score")
        .eq("profile_id", childId)
        .gte("week_start", weekStartISO)
        .order("rank", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("feed_items")
        .select("id, type, metadata, created_at")
        .eq("profile_id", childId)
        .order("created_at", { ascending: false })
        .limit(5),
      getTeamNews(supabase, childId),
      // Previous week clips
      supabase
        .from("clips")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", childId)
        .gte("created_at", prevWeekStartISO)
        .lt("created_at", weekStartISO),
      // Previous week kudos
      (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ data: number | null }> })
        .rpc("count_weekly_kudos", { p_profile_id: childId, p_week_start: prevWeekStartISO }),
    ]);

    const childProfile = getSettledQueryData<{
      id: string;
      name: string;
      handle: string;
      avatar_url: string | null;
      position: string | null;
      level: number;
      xp: number;
      followers_count: number;
      views_count: number;
    }>(childProfileResult);
    const weeklyClipsCount = getSettledCount(weeklyClipsResult);
    const weeklyKudos = getSettledQueryData<number>(weeklyKudosResult) ?? 0;
    const weeklyViews = getSettledQueryData<{ views_count: number | null }>(weeklyViewsResult);
    const mvpResult = getSettledQueryData<{ rank: number | null; total_score: number | null }>(mvpResultResult);
    const recentActivity =
      getSettledQueryData<{ id: string; type: string; metadata: unknown; created_at: string }[]>(
        recentActivityResult
      ) ?? [];
    const teamNews = teamNewsResult.status === "fulfilled" ? teamNewsResult.value : [];
    const prevWeeklyClipsCount = getSettledCount(prevWeeklyClipsResult);
    const prevWeeklyKudos = getSettledQueryData<number>(prevWeeklyKudosResult) ?? 0;

    return NextResponse.json({
      parentName: profile.name,
      child: childProfile,
      weeklyStats: {
        newClips: weeklyClipsCount,
        kudosReceived: typeof weeklyKudos === "number" ? weeklyKudos : 0,
        profileViews: weeklyViews?.views_count ?? 0,
        mvpRank: mvpResult?.rank ?? null,
        level: childProfile?.level ?? 1,
      },
      prevWeeklyStats: {
        newClips: prevWeeklyClipsCount,
        kudosReceived: typeof prevWeeklyKudos === "number" ? prevWeeklyKudos : 0,
      },
      recentActivity: recentActivity.map((item) => ({
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
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("profile_id", childId)
    .neq("role", "alumni")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) return [];

  // Get recent team activity
  const teamId = membership.team_id;
  const teamName = (membership as unknown as { teams: { name: string } }).teams?.name ?? "팀";

  const { data: memberRows, error: membersError } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", teamId)
    .neq("role", "alumni");

  if (membersError) return [];

  const memberIds = memberRows?.map((m) => m.profile_id) ?? [];

  if (memberIds.length === 0) return [];

  const { count: teamClipCount, error: teamClipsError } = await supabase
    .from("clips")
    .select("id", { count: "exact", head: true })
    .in("owner_id", memberIds)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (teamClipsError) return [];

  return [
    {
      teamId,
      teamName,
      newClips: teamClipCount ?? 0,
    },
  ];
}

function getSettledQueryData<T>(
  result: PromiseSettledResult<QueryResult<T>>
): T | null {
  if (result.status !== "fulfilled" || result.value.error) {
    return null;
  }

  return result.value.data ?? null;
}

function getSettledCount(result: PromiseSettledResult<QueryResult<unknown>>): number {
  if (result.status !== "fulfilled" || result.value.error) {
    return 0;
  }

  return result.value.count ?? 0;
}
