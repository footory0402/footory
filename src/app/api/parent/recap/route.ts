import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/parent/recap?childId=<uuid>
// Returns last-week vs two-weeks-ago comparison
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "Parent role required" }, { status: 403 });
  }

  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const { data: link } = await supabase
    .from("parent_links")
    .select("id")
    .eq("parent_id", user.id)
    .eq("child_id", childId)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
  }

  // Week boundaries
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - diff);
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const twoWeeksAgoStart = new Date(lastWeekStart);
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);

  const lastWeekISO = lastWeekStart.toISOString();
  const thisWeekISO = thisWeekStart.toISOString();
  const twoWeeksISO = twoWeeksAgoStart.toISOString();

  // Fetch data for last week and two weeks ago
  const [childProfile, lastWeekClips, prevWeekClips, lastWeekKudos, prevWeekKudos, mvpResult] =
    await Promise.all([
      supabase.from("profiles").select("name, level, views_count").eq("id", childId).single(),

      supabase
        .from("clips")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", childId)
        .gte("created_at", lastWeekISO)
        .lt("created_at", thisWeekISO),

      supabase
        .from("clips")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", childId)
        .gte("created_at", twoWeeksISO)
        .lt("created_at", lastWeekISO),

      (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ data: number }> })
        .rpc("count_weekly_kudos", { p_profile_id: childId, p_week_start: lastWeekISO }).catch(() => ({ data: 0 })),
      (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ data: number }> })
        .rpc("count_weekly_kudos", { p_profile_id: childId, p_week_start: twoWeeksISO }).catch(() => ({ data: 0 })),

      supabase
        .from("weekly_mvp_results")
        .select("rank")
        .eq("profile_id", childId)
        .gte("week_start", lastWeekISO)
        .lt("week_start", thisWeekISO)
        .order("rank", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const clips = lastWeekClips.count ?? 0;
  const prevClips = prevWeekClips.count ?? 0;
  const kudos = typeof lastWeekKudos.data === "number" ? lastWeekKudos.data : 0;
  const prevKudos = typeof prevWeekKudos.data === "number" ? prevWeekKudos.data : 0;

  return NextResponse.json({
    childName: childProfile.data?.name ?? "",
    newClips: clips,
    clipsDelta: clips - prevClips,
    kudos,
    kudosDelta: kudos - prevKudos,
    views: childProfile.data?.views_count ?? 0,
    viewsDelta: 0, // Can't easily compute weekly delta without separate tracking
    mvpRank: mvpResult.data?.rank ?? null,
    level: childProfile.data?.level ?? 1,
    levelChanged: false, // Would need historical data to determine
  });
}
