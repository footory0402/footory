"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DiscoverHighlight, DiscoverMedal, DiscoverPlayer, DiscoverTeam } from "@/types/discover";

interface DiscoverHomeData {
  highlights: DiscoverHighlight[];
  medals: DiscoverMedal[];
  players: DiscoverPlayer[];
  teams: DiscoverTeam[];
}

// --- Discover Home (single request for all sections) ---
export function useDiscoverHome() {
  const [data, setData] = useState<DiscoverHomeData>({
    highlights: [],
    medals: [],
    players: [],
    teams: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover");
      if (res.ok) {
        const next = await res.json();
        setData({
          highlights: next.highlights ?? [],
          medals: next.medals ?? [],
          players: next.players ?? [],
          teams: next.teams ?? [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, refresh };
}

// --- Search ---
export function useSearch(query: string) {
  const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
  const [teams, setTeams] = useState<DiscoverTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setPlayers([]);
      setTeams([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discover/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players ?? []);
          setTeams(data.teams ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return { players, teams, loading };
}

// --- Hot Highlights ---
export function useHotHighlights() {
  const [items, setItems] = useState<DiscoverHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/highlights?limit=10");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { items, loading, refresh: fetch_ };
}

// --- Recent Medals ---
export function useRecentMedals() {
  const [medals, setMedals] = useState<DiscoverMedal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/medals?limit=10");
      if (res.ok) {
        const data = await res.json();
        setMedals(data.medals ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { medals, loading, refresh: fetch_ };
}

// --- Recommended Players ---
export function useRecommendedPlayers() {
  const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/players?limit=10");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { players, loading, refresh: fetch_ };
}

// --- Popular Teams ---
export function usePopularTeams() {
  const [teams, setTeams] = useState<DiscoverTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/teams?limit=10");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { teams, loading, refresh: fetch_ };
}
