"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeFeedOptions {
  feedItemIds: string[];
  onKudosChange?: (feedItemId: string, count: number) => void;
  onNewComment?: (feedItemId: string) => void;
}

export function useRealtimeFeed({ feedItemIds, onKudosChange, onNewComment }: UseRealtimeFeedOptions) {
  useEffect(() => {
    if (feedItemIds.length === 0) return;

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

          if (feedItemId && feedItemIds.includes(feedItemId) && onKudosChange) {
            // Refetch kudos count for this item
            supabase
              .from("kudos")
              .select("id", { count: "exact", head: true })
              .eq("feed_item_id", feedItemId)
              .then(({ count }) => {
                onKudosChange(feedItemId, count ?? 0);
              });
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
          if (feedItemId && feedItemIds.includes(feedItemId) && onNewComment) {
            onNewComment(feedItemId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [feedItemIds, onKudosChange, onNewComment]);
}
