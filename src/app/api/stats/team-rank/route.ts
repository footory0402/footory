import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stats/team-rank
 * Returns per-stat-type rank of the current user within their team.
 * Only includes rankings where 3+ team members have the same stat.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's team(s)
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", user.id)
    .neq("role", "alumni");

  if (!teamMemberships || teamMemberships.length === 0) {
    return NextResponse.json({ ranks: {} });
  }

  const teamIds = teamMemberships.map((t) => t.team_id);

  // Get all team members (including self)
  const { data: allMembers } = await supabase
    .from("team_members")
    .select("profile_id")
    .in("team_id", teamIds)
    .neq("role", "alumni");

  if (!allMembers || allMembers.length < 3) {
    return NextResponse.json({ ranks: {} });
  }

  const memberIds = [...new Set(allMembers.map((m) => m.profile_id))];

  // Get latest stat per type per member using distinct on
  const { data: allStats } = await supabase
    .from("stats")
    .select("profile_id, stat_type, value")
    .in("profile_id", memberIds)
    .order("recorded_at", { ascending: false });

  if (!allStats || allStats.length === 0) {
    return NextResponse.json({ ranks: {} });
  }

  // Dedupe: keep latest per (profile_id, stat_type)
  const latestMap = new Map<string, { profile_id: string; stat_type: string; value: number }>();
  for (const s of allStats) {
    const key = `${s.profile_id}:${s.stat_type}`;
    if (!latestMap.has(key)) latestMap.set(key, s);
  }

  // Group by stat_type
  const byType = new Map<string, { profile_id: string; value: number }[]>();
  for (const s of latestMap.values()) {
    const list = byType.get(s.stat_type) ?? [];
    list.push({ profile_id: s.profile_id, value: s.value });
    byType.set(s.stat_type, list);
  }

  // Lower-is-better stat types
  const lowerIsBetter = new Set(["sprint_50m", "sprint_30m", "30m_sprint", "run_1000m", "1000m_run"]);

  // Compute rank for current user per stat type
  const ranks: Record<string, { rank: number; total: number }> = {};

  for (const [statType, entries] of byType) {
    if (entries.length < 3) continue; // Only show when 3+ members have this stat

    const myEntry = entries.find((e) => e.profile_id === user.id);
    if (!myEntry) continue;

    // Sort: lower-is-better sorts ascending, otherwise descending
    const sorted = [...entries].sort((a, b) =>
      lowerIsBetter.has(statType) ? a.value - b.value : b.value - a.value
    );

    const rank = sorted.findIndex((e) => e.profile_id === user.id) + 1;
    ranks[statType] = { rank, total: sorted.length };
  }

  return NextResponse.json({ ranks });
}
