"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlayStyle } from "@/lib/types";
import type { PlayStyleType, StyleTraitKey } from "@/lib/constants";

export function usePlayStyle(profileId?: string) {
  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    fetch(`/api/play-style?profileId=${profileId}`)
      .then((r) => (r.ok ? r.json() : { playStyle: null }))
      .then((data) => setPlayStyle(data.playStyle ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId]);

  const savePlayStyle = useCallback(
    async (result: {
      styleType: PlayStyleType;
      traits: Record<StyleTraitKey, number>;
      answers: number[];
    }) => {
      const res = await fetch("/api/play-style", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (res.ok) {
        const data = await res.json();
        setPlayStyle(data.playStyle);
        return data.playStyle as PlayStyle;
      }
      throw new Error("Failed to save play style");
    },
    []
  );

  return { playStyle, loading, savePlayStyle };
}
