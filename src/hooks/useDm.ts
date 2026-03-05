"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";

interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Get other user profiles
    const otherIds = (data as ConversationRow[]).map((c) =>
      c.participant_1 === userId ? c.participant_2 : c.participant_1
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, city")
      .in("id", otherIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    // Get unread counts per conversation
    const { data: unreadData } = await supabase
      .from("messages")
      .select("conversation_id")
      .neq("sender_id", userId)
      .eq("is_read", false);

    const unreadMap = new Map<string, number>();
    (unreadData ?? []).forEach((m) => {
      const cid = m.conversation_id;
      unreadMap.set(cid, (unreadMap.get(cid) ?? 0) + 1);
    });

    const mapped: Conversation[] = (data as ConversationRow[]).map((c) => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
      const p = profileMap.get(otherId);
      return {
        id: c.id,
        participant1: c.participant_1,
        participant2: c.participant_2,
        lastMessageAt: c.last_message_at,
        lastMessagePreview: c.last_message_preview,
        createdAt: c.created_at,
        otherUser: p
          ? {
              id: p.id,
              handle: p.handle,
              name: p.name,
              avatarUrl: p.avatar_url ?? undefined,
              position: p.position as Conversation["otherUser"] extends { position: infer P } ? P : never,
              teamName: p.city ?? undefined,
            }
          : undefined,
        unreadCount: unreadMap.get(c.id) ?? 0,
      };
    });

    setConversations(mapped);
    setLoading(false);
  }, [userId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const mapped: Message[] = data.map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      sharedClipId: m.shared_clip_id,
      isRead: m.is_read,
      deletedAt: m.deleted_at,
      createdAt: m.created_at,
    }));

    setMessages(mapped);
    setLoading(false);
  }, [conversationId]);

  const addOptimistic = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { messages, loading, refetch: fetchMessages, addOptimistic, updateMessage };
}

export function useUnreadDmCount(userId: string | null) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    // Count conversations with unread messages from others
    const { data } = await supabase
      .from("messages")
      .select("conversation_id")
      .neq("sender_id", userId)
      .eq("is_read", false);

    if (data) {
      const uniqueConvs = new Set(data.map((m) => m.conversation_id));
      setCount(uniqueConvs.size);
    }
  }, [userId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { count, fetchCount };
}
