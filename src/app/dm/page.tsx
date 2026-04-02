"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/dm";
import { useConversations } from "@/hooks/useDm";
import dynamic from "next/dynamic";
import ConversationList from "@/components/dm/ConversationList";

const NewConversationSheet = dynamic(
  () => import("@/components/dm/NewConversationSheet"),
  { ssr: false }
);

export default function DmPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { conversations, loading } = useConversations(userId);

  const handleSelectUser = async (targetId: string) => {
    if (!userId) return;
    const convId = await getOrCreateConversation(userId, targetId);
    setShowNew(false);
    router.push(`/dm/${convId}`);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-[42px] z-30 flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            aria-label="뒤로가기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="font-display text-lg font-bold text-text-1">메시지</h2>
        </div>
        <button
          onClick={() => setShowNew(true)}
          aria-label="새 대화"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}

      {/* New conversation sheet */}
      {showNew && (
        <NewConversationSheet
          open={showNew}
          onClose={() => setShowNew(false)}
          onSelect={handleSelectUser}
        />
      )}
    </div>
  );
}
