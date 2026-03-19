"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Achievement } from "@/lib/types";

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
      const data = await res.json();
      setAchievements(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          profileId: r.profile_id as string,
          title: r.title as string,
          competition: (r.competition as string) ?? undefined,
          year: (r.year as number) ?? undefined,
          evidenceUrl: (r.evidence_url as string) ?? undefined,
          createdAt: r.created_at as string,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || hasFetchedRef.current) return;
    void fetchAchievements();
  }, [enabled, fetchAchievements]);

  const addAchievement = useCallback(
    async (input: { title: string; competition?: string; year?: number }) => {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add achievement");
      await fetchAchievements();
    },
    [fetchAchievements]
  );

  const removeAchievement = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/achievements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove achievement");
      await fetchAchievements();
    },
    [fetchAchievements]
  );

  return { achievements, loading, addAchievement, removeAchievement };
}
