"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Achievement } from "@/lib/types";

interface AchievementRow {
  id: string;
  profile_id: string;
  title: string;
  competition: string | null;
  year: number | null;
  evidence_url: string | null;
  created_at: string;
}

function toAchievement(row: AchievementRow): Achievement {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    competition: row.competition ?? undefined,
    year: row.year ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    createdAt: row.created_at,
  };
}

interface UseAchievementsOptions {
  enabled?: boolean;
}

export function useAchievements({ enabled = true }: UseAchievementsOptions = {}) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchAchievements = useCallback(async () => {
    hasFetchedRef.current = true;
    try {
      setLoading(true);
      const res = await fetch("/api/achievements");
      if (!res.ok) return;
      const data: AchievementRow[] = await res.json();
      setAchievements(data.map(toAchievement));
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
    void fetchAchievements();
  }, [enabled, fetchAchievements]);

  const addAchievement = useCallback(
    async (input: { title: string; competition?: string; year?: number; evidenceUrl?: string }) => {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          competition: input.competition,
          year: input.year,
          evidence_url: input.evidenceUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to add achievement");
      const row: AchievementRow = await res.json();
      setAchievements((prev) => [toAchievement(row), ...prev]);
    },
    []
  );

  const removeAchievement = useCallback(async (id: string) => {
    const res = await fetch(`/api/achievements/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete achievement");
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { achievements, loading, addAchievement, removeAchievement, refetch: fetchAchievements };
}
