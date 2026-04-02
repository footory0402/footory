"use client";

import { useState, useCallback, useRef } from "react";

export type FeedTab = "recommended" | "following";

export interface FeedItemEnriched {
  id: string;
  profile_id: string;
  type: "highlight" | "featured_change" | "stat" | "season" | "top_clip";
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl: string | null;
  playerPosition: string;
  playerBirthYear: number | null;
  teamName: string | null;
  kudosCount: number;
  hasKudos: boolean;
  commentCount: number;
  reactions: Partial<Record<string, number>>;
  myReaction: string | null;
}

const FEED_MEMORY_LIMIT = 25;

export function useFeed(
  initialItems: FeedItemEnriched[] = [],
  initialNextCursor: string | null = null,
  initialTab: FeedTab = "recommended"
) {
  const [items, setItems] = useState<FeedItemEnriched[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialNextCursor !== null || initialItems.length === 0);
  const [tab, setTabState] = useState<FeedTab>(initialTab);
  const cursorRef = useRef<string | null>(initialNextCursor);
  const inFlightRef = useRef(false);
  const tabRef = useRef<FeedTab>(initialTab);

  // Cache per tab so switching back is instant
  const cacheRef = useRef<Record<FeedTab, { items: FeedItemEnriched[]; cursor: string | null; hasMore: boolean }>>({
    recommended: { items: initialTab === "recommended" ? initialItems : [], cursor: initialTab === "recommended" ? initialNextCursor : null, hasMore: true },
    following: { items: initialTab === "following" ? initialItems : [], cursor: initialTab === "following" ? initialNextCursor : null, hasMore: true },
  });

  const fetchFeed = useCallback(async (reset = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    if (reset) setError(null);
    try {
      const cur = reset ? null : cursorRef.current;
      const currentTab = tabRef.current;
      const params = new URLSearchParams();
      params.set("tab", currentTab);
      if (cur) params.set("cursor", cur);
      const url = `/api/feed?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setError("피드를 불러오지 못했어요. 다시 시도해주세요.");
        return;
      }
      setError(null);
      const data = await res.json();
      const newItems: FeedItemEnriched[] = data.items ?? [];

      setItems((prev) => {
        const merged = reset ? newItems : [...prev, ...newItems];
        const bounded = merged.length > FEED_MEMORY_LIMIT
          ? merged.slice(-FEED_MEMORY_LIMIT)
          : merged;
        // Update cache
        cacheRef.current[currentTab] = { items: bounded, cursor: data.nextCursor, hasMore: !!data.nextCursor };
        return bounded;
      });
      cursorRef.current = data.nextCursor;
      setHasMore(!!data.nextCursor);
    } catch {
      setError("네트워크 오류가 발생했어요. 연결을 확인해주세요.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const setTab = useCallback((newTab: FeedTab) => {
    if (newTab === tabRef.current) return;
    // Save current state to cache
    tabRef.current = newTab;
    setTabState(newTab);

    const cached = cacheRef.current[newTab];
    if (cached.items.length > 0) {
      // Restore from cache
      setItems(cached.items);
      cursorRef.current = cached.cursor;
      setHasMore(cached.hasMore);
    } else {
      // No cache — fetch
      setItems([]);
      cursorRef.current = null;
      setHasMore(true);
      // fetchFeed with reset after state update
      setTimeout(() => fetchFeed(true), 0);
    }
  }, [fetchFeed]);

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

  return { items, loading, error, hasMore, tab, setTab, refresh, loadMore, toggleKudos, updateKudosCount, updateCommentCount };
}
