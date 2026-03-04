"use client";

import { useState, useEffect, useCallback } from "react";
import type { Season } from "@/lib/types";
import type { Position } from "@/lib/constants";

interface SeasonApiRow {
  id: string;
  profile_id: string;
  year: number;
  team_name: string;
  team_id: string | null;
  is_current: boolean;
  league: string | null;
  highlight_clip_id: string | null;
  created_at: string;
}

function toSeason(row: SeasonApiRow): Season {
  return {
    id: row.id,
    playerId: row.profile_id,
    year: row.year,
    teamName: row.team_name,
    teamId: row.team_id ?? undefined,
    isCurrent: row.is_current,
    position: "MF" as Position, // Default position; full implementation would store per-season position
    notes: row.league ?? undefined,
  };
}

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seasons");
      if (!res.ok) return;
      const data = await res.json();
      setSeasons((data.seasons ?? []).map(toSeason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const addSeason = useCallback(
    async (params: { year: number; teamName: string; teamId?: string; league?: string; isNewTeam: boolean }) => {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add season");
      }
      await fetchSeasons();
    },
    [fetchSeasons]
  );

  return { seasons, loading, fetchSeasons, addSeason };
}
