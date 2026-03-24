"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TournamentRecord } from "@/components/profile/CareerTabV5";

interface UseTournamentsOptions {
  enabled?: boolean;
}

export function useTournaments({ enabled = true }: UseTournamentsOptions = {}) {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchTournaments = useCallback(async () => {
    hasFetchedRef.current = true;
    try {
      setLoading(true);
      const res = await fetch("/api/tournament-records");
      if (!res.ok) return;
      const data = await res.json();
      setTournaments(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((r: any) => ({
          id: r.id as string,
          name: r.name as string,
          type: r.type as TournamentRecord["type"],
          dateText: (r.date_text as string) ?? null,
          result: (r.result as string) ?? null,
          goals: (r.goals as number) ?? 0,
          assists: (r.assists as number) ?? 0,
          isMvp: Boolean(r.is_mvp),
          source: (r.source as TournamentRecord["source"]) ?? "self",
          verifier: null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || hasFetchedRef.current) return;
    void fetchTournaments();
  }, [enabled, fetchTournaments]);

  const addTournament = useCallback(
    async (input: {
      name: string;
      type: TournamentRecord["type"];
      date_text?: string;
      result?: string;
      goals?: number;
      assists?: number;
      is_mvp?: boolean;
    }) => {
      const res = await fetch("/api/tournament-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("대회 기록 저장 실패");
      await fetchTournaments();
    },
    [fetchTournaments]
  );

  const removeTournament = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/tournament-records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("대회 기록 삭제 실패");
      await fetchTournaments();
    },
    [fetchTournaments]
  );

  return { tournaments, loading, addTournament, removeTournament };
}
