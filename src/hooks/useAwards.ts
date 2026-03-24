"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AwardRecord } from "@/components/profile/CareerTabV5";

interface UseAwardsOptions {
  enabled?: boolean;
}

export function useAwards({ enabled = true }: UseAwardsOptions = {}) {
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchAwards = useCallback(async () => {
    hasFetchedRef.current = true;
    try {
      setLoading(true);
      const res = await fetch("/api/awards");
      if (!res.ok) return;
      const data = await res.json();
      setAwards(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((r: any) => ({
          id: r.id as string,
          title: r.title as string,
          detail: (r.detail as string) ?? null,
          source: (r.source as AwardRecord["source"]) ?? "self",
          verifier: (r.verifier as string) ?? null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || hasFetchedRef.current) return;
    void fetchAwards();
  }, [enabled, fetchAwards]);

  const addAward = useCallback(
    async (input: { title: string; detail?: string; verifier?: string }) => {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("수상 기록 저장 실패");
      await fetchAwards();
    },
    [fetchAwards]
  );

  const removeAward = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/awards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("수상 기록 삭제 실패");
      await fetchAwards();
    },
    [fetchAwards]
  );

  return { awards, loading, addAward, removeAward };
}
