"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markAsRead, deleteMessage } from "@/lib/dm";
import { useMessages } from "@/hooks/useDm";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import ChatBubble from "@/components/dm/ChatBubble";
import MessageInput from "@/components/dm/MessageInput";
import type { Message } from "@/lib/types";

interface OtherUser {
  id: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  city: string | null;
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);

  const { messages, loading, addOptimistic, updateMessage } =
    useMessages(conversationId);

  // Get current user & other participant info
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get conversation to find other participant
      const { data: conv } = await supabase
        .from("conversations")
        .select("participant_1, participant_2")
        .eq("id", conversationId)
        .single();

      if (!conv) return;
      const otherId =
        conv.participant_1 === user.id
          ? conv.participant_2
          : conv.participant_1;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, position, city")
        .eq("id", otherId)
        .single();

      if (profile) setOtherUser(profile);

      // Mark as read
      markAsRead(conversationId);
    })();
  }, [conversationId]);

  // Realtime
  useRealtimeMessages(conversationId, {
    onNewMessage: useCallback(
      (msg: Message) => {
        // Avoid duplicate (optimistic already added)
        addOptimistic(msg);
        // Mark as read if from other user
        if (msg.senderId !== userId) {
          markAsRead(conversationId);
        }
      },
      [userId, conversationId, addOptimistic]
    ),
    onReadUpdate: useCallback(
      (msgId: string) => {
        updateMessage(msgId, { isRead: true });
      },
      [updateMessage]
    ),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSend = async (content: string) => {
    if (!userId) return;

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: userId,
      content,
      sharedClipId: null,
      isRead: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    addOptimistic(optimistic);

    await sendMessage(conversationId, content);
  };

  const handleDelete = async (msgId: string) => {
    await deleteMessage(msgId);
    updateMessage(msgId, { deletedAt: new Date().toISOString() });
    setMenuMsgId(null);
  };

  // Deduplicate messages by id (realtime may send duplicates)
  const uniqueMessages = messages.filter(
    (msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i
  );

  return (
    <div className="flex h-dvh flex-col bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => router.push("/dm")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {otherUser?.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-text-2">
            {otherUser?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text-1 truncate">
            {otherUser?.name ?? "..."}
          </p>
          {otherUser?.position && (
            <p className="text-[11px] text-text-3">
              {otherUser.position}
              {otherUser.city ? ` · ${otherUser.city}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-3">
            <p className="text-sm">첫 메시지를 보내보세요</p>
          </div>
        ) : (
          uniqueMessages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === userId}
              onLongPress={() =>
                msg.senderId === userId ? setMenuMsgId(msg.id) : undefined
              }
            />
          ))
        )}
      </div>

      {/* Delete confirmation */}
      {menuMsgId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-[430px] rounded-t-2xl bg-card p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <button
              onClick={() => handleDelete(menuMsgId)}
              className="w-full rounded-xl bg-red-500/20 py-3 text-center text-sm font-semibold text-red-400"
            >
              메시지 삭제
            </button>
            <button
              onClick={() => setMenuMsgId(null)}
              className="mt-2 w-full rounded-xl bg-surface py-3 text-center text-sm text-text-2"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pb-[env(safe-area-inset-bottom)]">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
