"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation, getPendingDmRequests } from "@/lib/dm";
import { useConversations } from "@/hooks/useDm";
import ConversationList from "@/components/dm/ConversationList";
import NewConversationSheet from "@/components/dm/NewConversationSheet";
import DmRequestCard from "@/components/dm/DmRequestCard";
import type { DmRequest } from "@/lib/types";

export default function DmPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [dmRequests, setDmRequests] = useState<DmRequest[]>([]);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));

    getPendingDmRequests().then(setDmRequests);
  }, []);

  const { conversations, loading } = useConversations(userId);

  const handleSelectUser = async (targetId: string) => {
    if (!userId) return;
    const convId = await getOrCreateConversation(userId, targetId);
    setShowNew(false);
    router.push(`/dm/${convId}`);
  };

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="sticky top-[42px] z-30 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
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
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* DM Requests */}
      {dmRequests.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2">
            <p className="text-[13px] font-semibold text-accent">
              DM 요청 ({dmRequests.length})
            </p>
          </div>
          {dmRequests.map((req) => (
            <DmRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}

      {/* New conversation sheet */}
      <NewConversationSheet
        open={showNew}
        onClose={() => setShowNew(false)}
        onSelect={handleSelectUser}
      />
    </div>
  );
}
