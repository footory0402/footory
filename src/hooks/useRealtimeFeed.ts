"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeFeedOptions {
  feedItemIds: string[];
  onKudosChange?: (feedItemId: string, count: number) => void;
  onNewComment?: (feedItemId: string) => void;
}

export function useRealtimeFeed({ feedItemIds, onKudosChange, onNewComment }: UseRealtimeFeedOptions) {
  const idsKey = feedItemIds.join("|");
  const kudosFetchInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!idsKey) return;

    const supabase = createClient();
    const itemIdSet = new Set(idsKey.split("|"));

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

          if (feedItemId && itemIdSet.has(feedItemId) && onKudosChange) {
            if (kudosFetchInFlightRef.current.has(feedItemId)) return;
            kudosFetchInFlightRef.current.add(feedItemId);

            const syncKudosCount = async () => {
              try {
                // Refetch kudos count for this item
                const { count } = await supabase
                  .from("kudos")
                  .select("id", { count: "exact", head: true })
                  .eq("feed_item_id", feedItemId);
                onKudosChange(feedItemId, count ?? 0);
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
          if (feedItemId && itemIdSet.has(feedItemId) && onNewComment) {
            onNewComment(feedItemId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idsKey, onKudosChange, onNewComment]);
}
