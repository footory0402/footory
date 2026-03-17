"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Stat } from "@/lib/types";
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

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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

  // Representative value: median of recent 3 records (or latest if < 3)
  const recent3 = sameType.slice(0, 3).map((x) => x.value);
  const representativeValue = recent3.length >= 3 ? median(recent3) : s.value;

  return {
    id: s.id,
    playerId: s.profile_id,
    type: s.stat_type,
    value: representativeValue,
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

interface UseStatsOptions {
  enabled?: boolean;
}

export function useStats({ enabled = true }: UseStatsOptions = {}) {
  const [stats, setStats] = useState<Stat[]>([]);
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

      // Deduplicate stats: keep latest per stat_type
      const latestByType = new Map<string, StatsApiStat>();
      for (const s of apiStats) {
        const existing = latestByType.get(s.stat_type);
        if (!existing || new Date(s.recorded_at) > new Date(existing.recorded_at)) {
          latestByType.set(s.stat_type, s);
        }
      }
      const latestStats = Array.from(latestByType.values());

      // 폐기된 stat_type은 표시하지 않음
      const VALID_STAT_IDS = new Set<string>(MEASUREMENTS.map((m) => m.id));
      const validStats = latestStats.filter((s) => VALID_STAT_IDS.has(s.stat_type));

      setStats(validStats.map((s) => {
        const m = MEASUREMENTS.find((m) => m.id === s.stat_type);
        return toStat(s, apiStats, m?.lowerIsBetter ?? false);
      }));
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
    ): Promise<{ warning: string | null }> => {
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statType, value, evidenceClipId }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add stat");
      }

      const { warning } = await res.json();
      await fetchStats();
      return { warning: warning ?? null };
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

  return { stats, loading, addStat, deleteStat, refetch: fetchStats };
}
