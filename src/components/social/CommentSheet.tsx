"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import { useComments } from "@/hooks/useComments";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

interface CommentSheetProps {
  feedItemId: string;
  open: boolean;
  onClose: () => void;
  onCommentCountChange?: (delta: number) => void;
}

export default function CommentSheet({ feedItemId, open, onClose, onCommentCountChange }: CommentSheetProps) {
  const { comments, loading, fetchComments, addComment, deleteComment } = useComments(feedItemId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      fetchComments();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(text.trim());
      setText("");
      onCommentCountChange?.(1);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 100);
    } catch {
      toast("댓글 등록에 실패했습니다", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-[430px] rounded-t-[16px] bg-card animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-8 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h3 className="text-[15px] font-semibold text-text-1">
            댓글 {comments.length > 0 && <span className="text-text-3 font-normal">{comments.length}</span>}
          </h3>
          <button onClick={onClose} className="text-text-3 hover:text-text-1 p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="max-h-[50vh] min-h-[200px] overflow-y-auto px-4 py-3 space-y-4">
          {loading && comments.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-center py-8 text-[13px] text-text-3">
              첫 댓글을 남겨보세요
            </p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="group flex gap-2.5">
              <Avatar
                name={c.profile.name}
                size="xs"
                level={c.profile.level}
                imageUrl={c.profile.avatar_url ?? undefined}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-text-1">{c.profile.name}</span>
                  <span className="text-[11px] text-text-3">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[13px] text-text-2 mt-0.5 break-words">{c.content}</p>
              </div>
              {/* Delete button — only for own comments */}
              {currentUserId === c.userId && (
                <button
                  onClick={() => { deleteComment(c.id); onCommentCountChange?.(-1); }}
                  className="shrink-0 self-start text-text-3 hover:text-red p-1 transition-opacity"
                  title="삭제"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="댓글 입력..."
            maxLength={500}
            className="flex-1 bg-surface rounded-full px-4 py-2 text-[13px] text-text-1 placeholder:text-text-3 outline-none focus:ring-1 focus:ring-accent/50"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="shrink-0 rounded-full bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-30 transition-opacity"
          >
            {submitting ? "..." : "전송"}
          </button>
        </div>
      </div>
    </div>
  );
}
