import type { Stat } from "@/lib/types";
import type { RadarStatId } from "@/lib/constants";
import { STAT_BOUNDS } from "@/lib/constants";

export interface ClipTagCount {
  tagName: string;
  count: number;
}

/** Clamp value to 0–99 range */
function clamp99(v: number): number {
  return Math.max(0, Math.min(99, Math.round(v)));
}

/**
 * Normalize a raw stat value to 0–99 using STAT_BOUNDS.
 * For "lower is better" stats (sprint, run), lower raw = higher score.
 */
function normalizeStatValue(
  statType: string,
  value: number,
  lowerIsBetter: boolean
): number {
  const bounds = STAT_BOUNDS[statType];
  if (!bounds) return 50;

  const { min, max } = bounds;
  if (max === min) return 50;

  let ratio: number;
  if (lowerIsBetter) {
    // Lower value = better → higher score
    ratio = (max - value) / (max - min);
  } else {
    ratio = (value - min) / (max - min);
  }

  return clamp99(ratio * 99);
}

/**
 * Get bonus points from clip tags.
 * Each matching clip tag adds 3 points, capped at +15.
 */
function tagBonus(clipTags: ClipTagCount[], ...tagNames: string[]): number {
  const total = tagNames.reduce((sum, name) => {
    const found = clipTags.find(
      (t) => t.tagName === name || t.tagName.includes(name)
    );
    return sum + (found?.count ?? 0);
  }, 0);
  return Math.min(total * 3, 15);
}

/**
 * Calculate radar stats from measurement data + clip tag counts.
 *
 * - pace: sprint_50m percentile/normalized value
 * - shooting: kick_power percentile/normalized + shooting tag bonus
 * - passing: forward-pass tag clips (scaled 0~99)
 * - dribbling: juggling percentile/normalized + 1v1 dribble tag bonus
 * - defense: 1v1 defense + heading contest tag clips
 * - physical: run_1000m percentile/normalized value
 */
export function calcRadarStats(
  stats: Stat[],
  clipTags: ClipTagCount[],
  percentiles?: Record<string, number>
): Record<RadarStatId, number> {
  const statMap = new Map(stats.map((s) => [s.type, s]));

  function resolveAxis(
    statType: string,
    lowerIsBetter: boolean,
    bonusTags: string[]
  ): number {
    let base = 0;
    let hasData = false;

    // Priority 1: percentile
    if (percentiles?.[statType] != null) {
      base = clamp99(percentiles[statType]);
      hasData = true;
    }
    // Priority 2: raw measurement value → normalize
    else if (statMap.has(statType)) {
      const stat = statMap.get(statType)!;
      base = normalizeStatValue(statType, stat.value, lowerIsBetter);
      hasData = true;
    }

    // Clip tag bonus
    const bonus = tagBonus(clipTags, ...bonusTags);
    if (bonus > 0) hasData = true;

    return hasData ? clamp99(base + bonus) : 0;
  }

  // For pure tag-based axes (no direct measurement mapping)
  function tagOnlyAxis(...tagNames: string[]): number {
    const total = tagNames.reduce((sum, name) => {
      const found = clipTags.find(
        (t) => t.tagName === name || t.tagName.includes(name)
      );
      return sum + (found?.count ?? 0);
    }, 0);
    if (total === 0) return 0;
    // Scale: 1 clip = 15, 3 clips = 40, 6 clips = 65, 10+ = 85~99
    return clamp99(Math.min(15 + total * 9, 99));
  }

  return {
    pace: resolveAxis("sprint_50m", true, []),
    shooting: resolveAxis("kick_power", false, ["슈팅"]),
    passing: tagOnlyAxis("전진패스"),
    dribbling: resolveAxis("juggling", false, ["1v1 돌파"]),
    defense: tagOnlyAxis("1v1 수비", "헤딩경합"),
    physical: resolveAxis("run_1000m", true, []),
  };
}

/**
 * Calculate radar stats using firstValue (earliest recorded) instead of current.
 * Used for "과거의 나 vs 현재의 나" overlay comparison.
 * Returns null if no first values exist (no growth data).
 */
export function calcRadarStatsFromFirstValues(
  stats: Stat[],
  clipTags: ClipTagCount[],
): Record<RadarStatId, number> | null {
  // Only include stats that have a firstValue different from current
  const pastStats: Stat[] = stats
    .filter((s) => s.firstValue != null && s.firstValue !== s.value)
    .map((s) => ({ ...s, value: s.firstValue! }));

  if (pastStats.length === 0) return null;

  return calcRadarStats(pastStats, clipTags);
}

/** Default empty radar stats (all zeros) */
export const EMPTY_RADAR_STATS: Record<RadarStatId, number> = {
  pace: 0,
  shooting: 0,
  passing: 0,
  dribbling: 0,
  defense: 0,
  physical: 0,
};
