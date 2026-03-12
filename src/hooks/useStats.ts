"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Stat, Medal } from "@/lib/types";
import type { AwardedMedal } from "@/lib/medals";
import { MEASUREMENTS } from "@/lib/constants";

interface StatsApiStat {
  id: string;
  profile_id: string;
  stat_type: string;
  value: number;
  unit: string;
  evidence_clip_id: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  recorded_at: string;
  created_at: string;
}

interface StatsApiMedal {
  id: string;
  profile_id: string;
  medal_code: string;
  stat_id: string | null;
  achieved_at: string;
  medal_criteria: {
    code: string;
    stat_type: string;
    threshold: number;
    comparison: "lte" | "gte";
    icon: string;
    label: string;
    difficulty_tier: number;
    unit: string;
  } | null;
}

function toStat(s: StatsApiStat, allStats: StatsApiStat[], lowerIsBetter: boolean): Stat {
  // Find all records for same stat type, sorted newest first
  const sameType = allStats
    .filter((x) => x.stat_type === s.stat_type)
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

  const previous = sameType.find((x) => x.id !== s.id);
  const oldest = sameType[sameType.length - 1];

  // Best value (PR) — depends on whether lower is better
  const allValues = sameType.map((x) => x.value);
  const bestValue = lowerIsBetter ? Math.min(...allValues) : Math.max(...allValues);
  const isPR = s.value === bestValue;

  return {
    id: s.id,
    playerId: s.profile_id,
    type: s.stat_type,
    value: s.value,
    previousValue: previous?.value,
    unit: s.unit,
    measuredAt: s.recorded_at,
    evidenceClipId: s.evidence_clip_id ?? undefined,
    verified: s.verified,
    bestValue,
    isPR,
    firstValue: oldest?.value,
    firstMeasuredAt: oldest?.recorded_at,
    measureCount: sameType.length,
  };
}

function toMedal(m: StatsApiMedal): Medal {
  const c = m.medal_criteria;
  return {
    id: m.id,
    playerId: m.profile_id,
    type: c?.stat_type ?? "",
    label: c?.label ?? m.medal_code,
    value: c?.threshold ?? 0,
    unit: c?.unit ?? "",
    difficultyTier: c?.difficulty_tier ?? 1,
    verified: false,
    awardedAt: m.achieved_at,
  };
}

interface UseStatsOptions {
  enabled?: boolean;
}

export function useStats({ enabled = true }: UseStatsOptions = {}) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    hasFetchedRef.current = true;
    try {
      setLoading(true);
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      const apiStats: StatsApiStat[] = data.stats;
      const apiMedals: StatsApiMedal[] = data.medals;

      // Deduplicate stats: keep latest per stat_type
      const latestByType = new Map<string, StatsApiStat>();
      for (const s of apiStats) {
        const existing = latestByType.get(s.stat_type);
        if (!existing || new Date(s.recorded_at) > new Date(existing.recorded_at)) {
          latestByType.set(s.stat_type, s);
        }
      }
      const latestStats = Array.from(latestByType.values());

      setStats(latestStats.map((s) => {
        const m = MEASUREMENTS.find((m) => m.id === s.stat_type);
        return toStat(s, apiStats, m?.lowerIsBetter ?? false);
      }));
      setMedals(apiMedals.map(toMedal));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;
    void fetchStats();
  }, [enabled, fetchStats]);

  const addStat = useCallback(
    async (
      statType: string,
      value: number,
      evidenceClipId?: string
    ): Promise<AwardedMedal[]> => {
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statType, value, evidenceClipId }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add stat");
      }

      const { newMedals } = await res.json();
      await fetchStats();
      return newMedals ?? [];
    },
    [fetchStats]
  );

  const deleteStat = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/stats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete stat");
      await fetchStats();
    },
    [fetchStats]
  );

  return { stats, medals, loading, addStat, deleteStat, refetch: fetchStats };
}
