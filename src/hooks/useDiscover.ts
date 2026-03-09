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

const DISCOVER_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_TTL_MS = 20_000;

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const discoverCache = new Map<string, CacheEntry>();
const discoverInFlight = new Map<string, Promise<unknown>>();

function getCachedValue<T>(key: string): T | null {
  const cached = discoverCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    discoverCache.delete(key);
    return null;
  }
  return cached.value as T;
}

function setCachedValue<T>(key: string, value: T, ttlMs = DISCOVER_CACHE_TTL_MS) {
  discoverCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function fetchCachedJson<T>(
  key: string,
  url: string,
  options?: { force?: boolean; ttlMs?: number; signal?: AbortSignal }
): Promise<T | null> {
  const force = options?.force ?? false;

  if (!force) {
    const cached = getCachedValue<T>(key);
    if (cached) return cached;

    const pending = discoverInFlight.get(key) as Promise<T> | undefined;
    if (pending) {
      try {
        return await pending;
      } catch {
        return null;
      }
    }
  }

  const request = fetch(url, { signal: options?.signal })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as T;
      setCachedValue(key, data, options?.ttlMs ?? DISCOVER_CACHE_TTL_MS);
      return data;
    })
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
      return null;
    })
    .finally(() => {
      if (discoverInFlight.get(key) === request) {
        discoverInFlight.delete(key);
      }
    });

  discoverInFlight.set(key, request as Promise<unknown>);
  return request;
}

// --- Discover Home (single request for all sections) ---
export function useDiscoverHome() {
  const cacheKey = "discover:home";
  const endpoint = "/api/discover";
  const cached = getCachedValue<DiscoverHomeData>(cacheKey);

  const [data, setData] = useState<DiscoverHomeData>(
    cached ?? {
      highlights: [],
      medals: [],
      players: [],
      teams: [],
    }
  );
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async (force = false) => {
    if (!force) {
      const snapshot = getCachedValue<DiscoverHomeData>(cacheKey);
      if (snapshot) {
        setData(snapshot);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const next = await fetchCachedJson<DiscoverHomeData>(cacheKey, endpoint, { force });
    if (next) {
      setData({
        highlights: next.highlights ?? [],
        medals: next.medals ?? [],
        players: next.players ?? [],
        teams: next.teams ?? [],
      });
    }
    setLoading(false);
  }, [cacheKey, endpoint]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    ...data,
    loading,
    refresh: useCallback(async () => refresh(true), [refresh]),
  };
}

// --- Search ---
export function useSearch(query: string) {
  const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
  const [teams, setTeams] = useState<DiscoverTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const controller = new AbortController();

    const trimmed = query.trim();
    if (!trimmed) {
      setPlayers([]);
      setTeams([]);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const normalized = trimmed.toLowerCase();
      const cacheKey = `discover:search:${normalized}`;
      const endpoint = `/api/discover/search?q=${encodeURIComponent(trimmed)}`;
      const cached = getCachedValue<{ players?: DiscoverPlayer[]; teams?: DiscoverTeam[] }>(cacheKey);

      if (cached) {
        setPlayers(cached.players ?? []);
        setTeams(cached.teams ?? []);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await fetchCachedJson<{ players?: DiscoverPlayer[]; teams?: DiscoverTeam[] }>(
        cacheKey,
        endpoint,
        { ttlMs: SEARCH_CACHE_TTL_MS, signal: controller.signal }
      );

      if (data) {
        setPlayers(data.players ?? []);
        setTeams(data.teams ?? []);
      }
      setLoading(false);
    }, 300);

    return () => {
      controller.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
  const cacheKey = `discover:player-ranking:${sort}`;
  const endpoint = `/api/discover/ranking?sort=${sort}&limit=100`;
  const cached = getCachedValue<{ items?: PlayerRankingItem[] }>(cacheKey);
  const [items, setItems] = useState<PlayerRankingItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);

  const fetchRanking = useCallback(async (force = false) => {
    if (!force) {
      const snapshot = getCachedValue<{ items?: PlayerRankingItem[] }>(cacheKey);
      if (snapshot) {
        setItems(snapshot.items ?? []);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const data = await fetchCachedJson<{ items?: PlayerRankingItem[] }>(cacheKey, endpoint, { force });
    if (data) {
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [cacheKey, endpoint]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchRanking(); }, [fetchRanking]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return {
    items,
    loading,
    refresh: useCallback(async () => fetchRanking(true), [fetchRanking]),
  };
}

// --- Team Ranking ---
export function useTeamRanking() {
  const cacheKey = "discover:team-ranking";
  const endpoint = "/api/discover/teams/ranking?limit=100";
  const cached = getCachedValue<{ items?: TeamRankingItem[] }>(cacheKey);
  const [items, setItems] = useState<TeamRankingItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);

  const fetchRanking = useCallback(async (force = false) => {
    if (!force) {
      const snapshot = getCachedValue<{ items?: TeamRankingItem[] }>(cacheKey);
      if (snapshot) {
        setItems(snapshot.items ?? []);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const data = await fetchCachedJson<{ items?: TeamRankingItem[] }>(cacheKey, endpoint, { force });
    if (data) {
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [cacheKey, endpoint]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchRanking(); }, [fetchRanking]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return {
    items,
    loading,
    refresh: useCallback(async () => fetchRanking(true), [fetchRanking]),
  };
}

// --- Rising Players ---
export function useRisingPlayers() {
  const cacheKey = "discover:rising";
  const endpoint = "/api/discover/rising?limit=20";
  const cached = getCachedValue<{ items?: RisingPlayerItem[] }>(cacheKey);
  const [items, setItems] = useState<RisingPlayerItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);

  const fetchRising = useCallback(async (force = false) => {
    if (!force) {
      const snapshot = getCachedValue<{ items?: RisingPlayerItem[] }>(cacheKey);
      if (snapshot) {
        setItems(snapshot.items ?? []);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const data = await fetchCachedJson<{ items?: RisingPlayerItem[] }>(cacheKey, endpoint, { force });
    if (data) {
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [cacheKey, endpoint]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchRising(); }, [fetchRising]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return {
    items,
    loading,
    refresh: useCallback(async () => fetchRising(true), [fetchRising]),
  };
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
  const cacheKey = tag ? `discover:tag-clips:${tag}` : "";
  const endpoint = tag ? `/api/discover/tags?tag=${encodeURIComponent(tag)}&limit=18` : null;
  const cached = tag ? getCachedValue<{ items?: TagClipItem[] }>(cacheKey) : null;
  const [items, setItems] = useState<TagClipItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(Boolean(tag) && !cached);

  const fetchClips = useCallback(async (force = false) => {
    if (!tag || !endpoint) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!force) {
      const snapshot = getCachedValue<{ items?: TagClipItem[] }>(cacheKey);
      if (snapshot) {
        setItems(snapshot.items ?? []);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const data = await fetchCachedJson<{ items?: TagClipItem[] }>(cacheKey, endpoint, { force });
    if (data) {
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [cacheKey, endpoint, tag]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchClips(); }, [fetchClips]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return {
    items,
    loading,
    refresh: useCallback(async () => fetchClips(true), [fetchClips]),
  };
}
