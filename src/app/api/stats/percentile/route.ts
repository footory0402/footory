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

  // Representative value per stat_type: median of recent 3 records (or latest if < 3)
  const recordsByType = new Map<string, number[]>();
  for (const s of myStats) {
    const arr = recordsByType.get(s.stat_type) ?? [];
    if (arr.length < 3) arr.push(Number(s.value));
    recordsByType.set(s.stat_type, arr);
  }

  function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  const latestByType = new Map<string, number>();
  for (const [type, values] of recordsByType.entries()) {
    latestByType.set(type, median(values));
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

    // Representative value per player: median of recent 3
    const playerRecords = new Map<string, number[]>();
    for (const row of allOfType) {
      const arr = playerRecords.get(row.profile_id) ?? [];
      if (arr.length < 3) arr.push(Number(row.value));
      playerRecords.set(row.profile_id, arr);
    }

    const values = Array.from(playerRecords.values()).map(median);
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
