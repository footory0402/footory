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
  const kudosFetchInFlightRef = useRef<Set<string>>(new Set());
  const onKudosChangeRef = useRef(onKudosChange);
  const onNewCommentRef = useRef(onNewComment);

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
    const supabase = createClient();

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
            if (kudosFetchInFlightRef.current.has(feedItemId)) return;
            kudosFetchInFlightRef.current.add(feedItemId);

            const syncKudosCount = async () => {
              try {
                const { count } = await supabase
                  .from("kudos")
                  .select("id", { count: "exact", head: true })
                  .eq("feed_item_id", feedItemId);
                onKudosChangeRef.current?.(feedItemId, count ?? 0);
              } finally {
                kudosFetchInFlightRef.current.delete(feedItemId);
              }
            };

            void syncKudosCount();
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
