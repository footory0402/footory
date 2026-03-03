"use client";

import { useState, useCallback } from "react";

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

export function useFeed() {
  const [items, setItems] = useState<FeedItemEnriched[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchFeed = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const url = reset || !cursor
        ? "/api/feed"
        : `/api/feed?cursor=${encodeURIComponent(cursor)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: FeedItemEnriched[] = data.items ?? [];

      setItems((prev) => reset ? newItems : [...prev, ...newItems]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchFeed(false);
  }, [fetchFeed, loading, hasMore]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    try {
      const res = await fetch("/api/feed");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleKudos = useCallback(async (feedItemId: string) => {
    const item = items.find((i) => i.id === feedItemId);
    if (!item) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === feedItemId
          ? {
              ...i,
              hasKudos: !i.hasKudos,
              kudosCount: i.hasKudos ? i.kudosCount - 1 : i.kudosCount + 1,
            }
          : i
      )
    );

    const method = item.hasKudos ? "DELETE" : "POST";
    const res = await fetch(`/api/feed/${feedItemId}/kudos`, { method });

    if (!res.ok) {
      // Rollback
      setItems((prev) =>
        prev.map((i) =>
          i.id === feedItemId
            ? {
                ...i,
                hasKudos: item.hasKudos,
                kudosCount: item.kudosCount,
              }
            : i
        )
      );
    }
  }, [items]);

  const updateKudosCount = useCallback((feedItemId: string, count: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === feedItemId ? { ...i, kudosCount: count } : i))
    );
  }, []);

  return { items, loading, hasMore, refresh, loadMore, toggleKudos, updateKudosCount };
}
