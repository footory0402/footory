"use client";

import { useState, useCallback, useRef } from "react";

export interface FeedItemEnriched {
  id: string;
  profile_id: string;
  type: "highlight" | "featured_change" | "medal" | "stat" | "season" | "top_clip";
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl: string | null;
  playerLevel: number;
  playerPosition: string;
  teamName: string | null;
  kudosCount: number;
  hasKudos: boolean;
  commentCount: number;
}

export function useFeed(
  initialItems: FeedItemEnriched[] = [],
  initialNextCursor: string | null = null
) {
  const [items, setItems] = useState<FeedItemEnriched[]>(initialItems);
  // Start loading=false: server already provided initial data
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialNextCursor !== null || initialItems.length === 0);
  const cursorRef = useRef<string | null>(initialNextCursor);
  const inFlightRef = useRef(false);

  const fetchFeed = useCallback(async (reset = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const cur = cursorRef.current;
      const url = reset || !cur
        ? "/api/feed"
        : `/api/feed?cursor=${encodeURIComponent(cur)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: FeedItemEnriched[] = data.items ?? [];

      setItems((prev) => reset ? newItems : [...prev, ...newItems]);
      cursorRef.current = data.nextCursor;
      setHasMore(!!data.nextCursor);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    await fetchFeed(false);
  }, [fetchFeed, hasMore]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    setHasMore(true);
    await fetchFeed(true);
  }, [fetchFeed]);

  // Use functional setState so toggleKudos has no dependency on `items`
  // This keeps the reference stable and prevents FeedCard re-renders
  const toggleKudos = useCallback(async (feedItemId: string) => {
    let originalItem: FeedItemEnriched | undefined;

    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === feedItemId);
      if (index === -1) return prev;

      const current = prev[index];
      originalItem = current;

      const next = [...prev];
      next[index] = {
        ...current,
        hasKudos: !current.hasKudos,
        kudosCount: current.hasKudos
          ? current.kudosCount - 1
          : current.kudosCount + 1,
      };
      return next;
    });

    // Wait a tick so originalItem is captured from the setter above
    await Promise.resolve();

    const snapshot = originalItem;
    if (!snapshot) return;
    const method = snapshot.hasKudos ? "DELETE" : "POST";
    const res = await fetch(`/api/feed/${feedItemId}/kudos`, { method });

    if (!res.ok) {
      // Rollback
      setItems((prev) => {
        const index = prev.findIndex((i) => i.id === feedItemId);
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = { ...next[index], hasKudos: snapshot.hasKudos, kudosCount: snapshot.kudosCount };
        return next;
      });
    }
  }, []);

  const updateKudosCount = useCallback((feedItemId: string, count: number) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === feedItemId);
      if (index === -1 || prev[index].kudosCount === count) return prev;
      const next = [...prev];
      next[index] = { ...next[index], kudosCount: count };
      return next;
    });
  }, []);

  const updateCommentCount = useCallback((feedItemId: string, delta: number) => {
    if (delta === 0) return;
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === feedItemId);
      if (index === -1) return prev;

      const nextCount = Math.max(0, prev[index].commentCount + delta);
      if (nextCount === prev[index].commentCount) return prev;

      const next = [...prev];
      next[index] = { ...next[index], commentCount: nextCount };
      return next;
    });
  }, []);

  return { items, loading, hasMore, refresh, loadMore, toggleKudos, updateKudosCount, updateCommentCount };
}
