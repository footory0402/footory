"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeFeedOptions {
  feedItemIds: string[];
  onKudosChange?: (feedItemId: string, count: number) => void;
  onNewComment?: (feedItemId: string) => void;
}

export function useRealtimeFeed({ feedItemIds, onKudosChange, onNewComment }: UseRealtimeFeedOptions) {
  const itemIdSetRef = useRef<Set<string>>(new Set(feedItemIds));
  const onKudosChangeRef = useRef(onKudosChange);
  const onNewCommentRef = useRef(onNewComment);
  const pendingKudosSyncRef = useRef<Set<string>>(new Set());
  const kudosFetchInFlightRef = useRef<Set<string>>(new Set());
  const kudosFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    itemIdSetRef.current = new Set(feedItemIds);
  }, [feedItemIds]);

  useEffect(() => {
    onKudosChangeRef.current = onKudosChange;
  }, [onKudosChange]);

  useEffect(() => {
    onNewCommentRef.current = onNewComment;
  }, [onNewComment]);

  useEffect(() => {
    // Defer WebSocket to not compete with initial render
    const timer = setTimeout(() => {
      setupChannel();
    }, 3000);

    let channelRef: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    function setupChannel() {
    const supabase = createClient();

    const flushPendingKudos = async () => {
      const feedItemIds = Array.from(pendingKudosSyncRef.current);
      pendingKudosSyncRef.current.clear();
      kudosFlushTimerRef.current = null;

      await Promise.all(
        feedItemIds.map(async (feedItemId) => {
          if (kudosFetchInFlightRef.current.has(feedItemId)) return;
          kudosFetchInFlightRef.current.add(feedItemId);

          try {
            const { count } = await supabase
              .from("kudos")
              .select("id", { count: "exact", head: true })
              .eq("feed_item_id", feedItemId);
            onKudosChangeRef.current?.(feedItemId, count ?? 0);
          } finally {
            kudosFetchInFlightRef.current.delete(feedItemId);
          }
        })
      );
    };

    const scheduleKudosSync = (feedItemId: string) => {
      pendingKudosSyncRef.current.add(feedItemId);
      if (kudosFlushTimerRef.current) return;
      kudosFlushTimerRef.current = setTimeout(() => {
        void flushPendingKudos();
      }, 1200);
    };

    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kudos",
        },
        (payload) => {
          const feedItemId = (payload.new as Record<string, unknown>)?.feed_item_id as string
            ?? (payload.old as Record<string, unknown>)?.feed_item_id as string;

          if (feedItemId && itemIdSetRef.current.has(feedItemId) && onKudosChangeRef.current) {
            scheduleKudosSync(feedItemId);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          const feedItemId = (payload.new as Record<string, unknown>)?.feed_item_id as string;
          if (feedItemId && itemIdSetRef.current.has(feedItemId) && onNewCommentRef.current) {
            onNewCommentRef.current(feedItemId);
          }
        }
      )
      .subscribe();

    channelRef = channel;
    }

    return () => {
      clearTimeout(timer);
      if (kudosFlushTimerRef.current) {
        clearTimeout(kudosFlushTimerRef.current);
      }
      if (channelRef) {
        const supabase = createClient();
        supabase.removeChannel(channelRef);
      }
    };
  }, []);
}
