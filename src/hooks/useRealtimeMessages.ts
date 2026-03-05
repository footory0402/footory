"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

interface RealtimeCallbacks {
  onNewMessage: (msg: Message) => void;
  onReadUpdate: (msgId: string) => void;
}

export function useRealtimeMessages(
  conversationId: string | null,
  callbacks: RealtimeCallbacks
) {
  const cbRef = useRef(callbacks);

  useEffect(() => {
    cbRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg: Message = {
            id: row.id as string,
            conversationId: row.conversation_id as string,
            senderId: row.sender_id as string,
            content: row.content as string | null,
            sharedClipId: row.shared_clip_id as string | null,
            isRead: row.is_read as boolean,
            deletedAt: row.deleted_at as string | null,
            createdAt: row.created_at as string,
          };
          cbRef.current.onNewMessage(msg);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.is_read) {
            cbRef.current.onReadUpdate(row.id as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
