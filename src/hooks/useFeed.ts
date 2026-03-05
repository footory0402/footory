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
  reactions: Partial<Record<string, number>>;
  myReaction: string | null;
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

  // Toggle 👏 clap (default reaction) — keeps original behavior
  const toggleKudos = useCallback(async (feedItemId: string, reaction = "clap") => {
    let originalItem: FeedItemEnriched | undefined;

    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === feedItemId);
      if (index === -1) return prev;

      const current = prev[index];
      originalItem = current;

      const alreadyReacted = current.myReaction === reaction;
      const nextReactions = { ...current.reactions };
      if (alreadyReacted) {
        nextReactions[reaction] = Math.max(0, (nextReactions[reaction] ?? 1) - 1);
      } else {
        // Remove old reaction count if switching
        if (current.myReaction) {
          nextReactions[current.myReaction] = Math.max(0, (nextReactions[current.myReaction] ?? 1) - 1);
        }
        nextReactions[reaction] = (nextReactions[reaction] ?? 0) + 1;
      }

      const next = [...prev];
      next[index] = {
        ...current,
        hasKudos: alreadyReacted ? false : true,
        kudosCount: alreadyReacted ? current.kudosCount - 1 : current.kudosCount + (current.myReaction ? 0 : 1),
        myReaction: alreadyReacted ? null : reaction,
        reactions: nextReactions,
      };
      return next;
    });

    await Promise.resolve();

    const snapshot = originalItem;
    if (!snapshot) return;
    const alreadyReacted = snapshot.myReaction === reaction;
    const method = alreadyReacted ? "DELETE" : "POST";
    const res = await fetch(`/api/feed/${feedItemId}/kudos`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });

    if (!res.ok) {
      // Rollback
      setItems((prev) => {
        const index = prev.findIndex((i) => i.id === feedItemId);
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = {
          ...next[index],
          hasKudos: snapshot.hasKudos,
          kudosCount: snapshot.kudosCount,
          myReaction: snapshot.myReaction,
          reactions: snapshot.reactions,
        };
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
