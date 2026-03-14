import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEASUREMENTS } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's latest stats per type
  const { data: myStats } = await supabase
    .from("stats")
    .select("stat_type, value")
    .eq("profile_id", user.id)
    .order("recorded_at", { ascending: false });

  if (!myStats || myStats.length === 0) {
    return NextResponse.json({ percentiles: {} });
  }

  // Deduplicate — keep latest per stat_type
  const latestByType = new Map<string, number>();
  for (const s of myStats) {
    if (!latestByType.has(s.stat_type)) {
      latestByType.set(s.stat_type, Number(s.value));
    }
  }

  const percentiles: Record<string, number> = {};

  for (const [statType, myValue] of latestByType.entries()) {
    const measurement = MEASUREMENTS.find((m) => m.id === statType);
    if (!measurement) continue;

    // Count total players with this stat type (latest per player)
    const { count: totalCount } = await supabase
      .from("stats")
      .select("profile_id", { count: "exact", head: true })
      .eq("stat_type", statType);

    if (!totalCount || totalCount <= 1) {
      percentiles[statType] = 50; // Only player — median
      continue;
    }

    // For lowerIsBetter stats (sprint), count how many have HIGHER (worse) values
    // For higherIsBetter stats (juggling), count how many have LOWER (worse) values
    // This gives us the percentile (how many you beat)
    //
    // Since we can't easily do "latest per player" aggregation in a single query,
    // we'll fetch all and compute in JS for now (acceptable for youth scale)
    const { data: allOfType } = await supabase
      .from("stats")
      .select("profile_id, value, recorded_at")
      .eq("stat_type", statType)
      .order("recorded_at", { ascending: false });

    if (!allOfType) continue;

    // Deduplicate: keep latest per player
    const playerLatest = new Map<string, number>();
    for (const row of allOfType) {
      if (!playerLatest.has(row.profile_id)) {
        playerLatest.set(row.profile_id, Number(row.value));
      }
    }

    const values = Array.from(playerLatest.values());
    const total = values.length;

    let betterCount: number;
    if (measurement.lowerIsBetter) {
      // Lower is better: count how many have higher (worse) values
      betterCount = values.filter((v) => v > myValue).length;
    } else {
      // Higher is better: count how many have lower (worse) values
      betterCount = values.filter((v) => v < myValue).length;
    }

    // Percentile = percentage of players you beat
    percentiles[statType] = Math.round((betterCount / total) * 100);
  }

  return NextResponse.json({ percentiles });
}
