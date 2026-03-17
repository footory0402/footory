import type { Stat } from "@/lib/types";
import type { RadarStatId } from "@/lib/constants";
import { STAT_BOUNDS, RADAR_STATS } from "@/lib/constants";

/** @deprecated Kept for backward compatibility but no longer used in radar calculation */
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
    ratio = (max - value) / (max - min);
  } else {
    ratio = (value - min) / (max - min);
  }

  return clamp99(ratio * 99);
}

/**
 * Resolve a single radar axis from measurement data.
 * Supports composite axes (e.g. "standing_jump,sit_ups" → average).
 */
function resolveAxis(
  statTypes: string,
  lowerIsBetter: boolean,
  statMap: Map<string, Stat>,
  percentiles?: Record<string, number>,
): number {
  const types = statTypes.split(",");
  const scores: number[] = [];

  for (const statType of types) {
    // Priority 1: percentile
    if (percentiles?.[statType] != null) {
      scores.push(clamp99(percentiles[statType]));
    }
    // Priority 2: raw measurement → normalize
    else if (statMap.has(statType)) {
      const stat = statMap.get(statType)!;
      scores.push(normalizeStatValue(statType, stat.value, lowerIsBetter));
    }
  }

  if (scores.length === 0) return 0;
  return clamp99(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate radar stats from measurement data only (no video tag dependency).
 *
 * 6축:
 * - speed: 50m 달리기 백분위
 * - endurance: 1000m 달리기 백분위
 * - agility: 왕복달리기 백분위
 * - power: 제자리멀리뛰기 + 윗몸일으키기 평균
 * - flexibility: 앉아윗몸앞으로굽히기 백분위
 * - control: 리프팅 백분위
 */
export function calcRadarStats(
  stats: Stat[],
  _clipTags?: ClipTagCount[],
  percentiles?: Record<string, number>
): Record<RadarStatId, number> {
  const statMap = new Map(stats.map((s) => [s.type, s]));

  const result: Record<string, number> = {};
  for (const axis of RADAR_STATS) {
    result[axis.id] = resolveAxis(axis.statType, axis.lowerIsBetter, statMap, percentiles);
  }

  return result as Record<RadarStatId, number>;
}

/**
 * Calculate radar stats using firstValue (earliest recorded) instead of current.
 * Used for "과거의 나 vs 현재의 나" overlay comparison.
 * Returns null if no first values exist (no growth data).
 */
export function calcRadarStatsFromFirstValues(
  stats: Stat[],
  _clipTags?: ClipTagCount[],
): Record<RadarStatId, number> | null {
  const pastStats: Stat[] = stats
    .filter((s) => s.firstValue != null && s.firstValue !== s.value)
    .map((s) => ({ ...s, value: s.firstValue! }));

  if (pastStats.length === 0) return null;

  return calcRadarStats(pastStats);
}

/** Default empty radar stats (all zeros) */
export const EMPTY_RADAR_STATS: Record<RadarStatId, number> = {
  speed: 0,
  endurance: 0,
  agility: 0,
  power: 0,
  flexibility: 0,
  control: 0,
};
