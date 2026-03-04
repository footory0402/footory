"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  DiscoverHighlight,
  DiscoverMedal,
  DiscoverPlayer,
  DiscoverTeam,
  PlayerRankingItem,
  TeamRankingItem,
  RisingPlayerItem,
  TagClipItem,
} from "@/types/discover";

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

// --- Player Ranking ---
export type PlayerSortKey = "popularity" | "followers" | "mvp";

export function usePlayerRanking(sort: PlayerSortKey = "popularity") {
  const [items, setItems] = useState<PlayerRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover/ranking?sort=${sort}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);
  return { items, loading, refresh: fetchRanking };
}

// --- Team Ranking ---
export function useTeamRanking() {
  const [items, setItems] = useState<TeamRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/teams/ranking?limit=20");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);
  return { items, loading, refresh: fetchRanking };
}

// --- Rising Players ---
export function useRisingPlayers() {
  const [items, setItems] = useState<RisingPlayerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRising = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/rising?limit=10");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRising(); }, [fetchRising]);
  return { items, loading, refresh: fetchRising };
}

// --- Follow Recommendations ---
export function useFollowRecommendations() {
  const [items, setItems] = useState<RisingPlayerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follows/recommend");
      if (res.ok) {
        const data = await res.json();
        setItems(
          (data.items ?? []).map((p: Record<string, unknown>) => ({
            profile_id: p.id,
            handle: p.handle,
            name: p.name,
            avatar_url: p.avatar_url,
            level: p.level ?? 1,
            position: p.position,
            followers_count: p.followers_count ?? 0,
            weekly_change: 0,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);
  return { items, loading, refresh: fetchRecommendations };
}

// --- Tag Clips ---
export function useTagClips(tag: string | null) {
  const [items, setItems] = useState<TagClipItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClips = useCallback(async () => {
    if (!tag) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/discover/tags?tag=${encodeURIComponent(tag)}&limit=18`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => { fetchClips(); }, [fetchClips]);
  return { items, loading, refresh: fetchClips };
}
