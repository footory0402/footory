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

  const fetchFeed = useCallback(async (reset = false) => {
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
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchFeed(false);
  }, [fetchFeed, loading, hasMore]);

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
      originalItem = prev.find((i) => i.id === feedItemId);
      if (!originalItem) return prev;
      return prev.map((i) =>
        i.id === feedItemId
          ? { ...i, hasKudos: !i.hasKudos, kudosCount: i.hasKudos ? i.kudosCount - 1 : i.kudosCount + 1 }
          : i
      );
    });

    // Wait a tick so originalItem is captured from the setter above
    await Promise.resolve();

    if (!originalItem) return;
    const method = originalItem.hasKudos ? "DELETE" : "POST";
    const res = await fetch(`/api/feed/${feedItemId}/kudos`, { method });

    if (!res.ok) {
      // Rollback
      const snap = originalItem;
      setItems((prev) =>
        prev.map((i) =>
          i.id === feedItemId
            ? { ...i, hasKudos: snap.hasKudos, kudosCount: snap.kudosCount }
            : i
        )
      );
    }
  }, []);

  const updateKudosCount = useCallback((feedItemId: string, count: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === feedItemId ? { ...i, kudosCount: count } : i))
    );
  }, []);

  return { items, loading, hasMore, refresh, loadMore, toggleKudos, updateKudosCount };
}
