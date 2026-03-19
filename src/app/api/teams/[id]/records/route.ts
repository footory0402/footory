import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    // Get team members
    const { data: members } = await supabase
      .from("team_members")
      .select("profile_id")
      .eq("team_id", teamId);

    if (!members || members.length === 0) {
      return NextResponse.json({ avgStats: [], recentRecords: [] });
    }

    const memberIds = members.map((m) => m.profile_id);

    // Fetch all stats for team members
    const { data: allStats } = await supabase
      .from("stats")
      .select("*")
      .in("profile_id", memberIds)
      .order("recorded_at", { ascending: false });

    // Fetch profiles for members
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, handle, avatar_url, position")
      .in("id", memberIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    if (!allStats || allStats.length === 0) {
      return NextResponse.json({ avgStats: [], recentRecords: [] });
    }

    // Calculate averages per stat_type (latest value per player per type)
    const latestByPlayerType = new Map<string, typeof allStats[number]>();
    for (const stat of allStats) {
      const key = `${stat.profile_id}:${stat.stat_type}`;
      if (!latestByPlayerType.has(key)) {
        latestByPlayerType.set(key, stat);
      }
    }

    const byType = new Map<string, { values: number[]; best: { value: number; name: string } }>();
    for (const stat of latestByPlayerType.values()) {
      const profile = profileMap.get(stat.profile_id);
      if (!byType.has(stat.stat_type)) {
        byType.set(stat.stat_type, {
          values: [],
          best: { value: Number(stat.value), name: profile?.name ?? "선수" },
        });
      }
      const entry = byType.get(stat.stat_type)!;
      entry.values.push(Number(stat.value));

      if (Number(stat.value) > entry.best.value) {
        entry.best = { value: Number(stat.value), name: profile?.name ?? "선수" };
      }
    }

    const avgStats = Array.from(byType.entries()).map(([statType, data]) => {
      const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      return {
        statType,
        avg: Math.round(avg * 10) / 10,
        count: data.values.length,
        best: data.best,
      };
    });

    // Recent records (last 10)
    const recentRecords = allStats.slice(0, 10).map((stat) => {
      const profile = profileMap.get(stat.profile_id);
      return {
        profileId: stat.profile_id,
        name: profile?.name ?? "선수",
        handle: profile?.handle ?? "",
        avatarUrl: profile?.avatar_url ?? undefined,
        position: profile?.position ?? undefined,
        statType: stat.stat_type,
        value: Number(stat.value),
        unit: stat.unit,
        recordedAt: stat.recorded_at,
      };
    });

    return NextResponse.json({ avgStats, recentRecords });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
