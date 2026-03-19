"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import { useComments } from "@/hooks/useComments";
import type { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import MentionInput, { renderMentionText } from "./MentionInput";
import Link from "next/link";

interface CommentSheetProps {
  feedItemId: string;
  open: boolean;
  onClose: () => void;
  onCommentCountChange?: (delta: number) => void;
}

function CommentRow({
  comment,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string | null;
  onReply: (comment: Comment) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <Link href={`/p/${comment.profile.handle}`} className="shrink-0">
        <Avatar
          name={comment.profile.name}
          size="xs"
          imageUrl={comment.profile.avatar_url ?? undefined}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/p/${comment.profile.handle}`} className="text-[13px] font-bold text-text-1 hover:text-accent transition-colors">
            {comment.profile.name}
          </Link>
          <span className="text-[11px] text-text-3">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] text-text-2 mt-0.5 break-words leading-relaxed">
          {renderMentionText(comment.content)}
        </p>
        {/* Reply button */}
        <button
          onClick={() => onReply(comment)}
          className="text-[11px] text-text-3 hover:text-accent mt-1 transition-colors"
        >
          답글달기
        </button>
      </div>
      {currentUserId === comment.userId && (
        <button
          onClick={() => onDelete(comment.id)}
          className="shrink-0 self-start text-text-3 hover:text-red-500 p-1"
          title="삭제"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function CommentSheet({ feedItemId, open, onClose, onCommentCountChange }: CommentSheetProps) {
  const { comments, loading, fetchComments, addComment, deleteComment, totalCount } = useComments(feedItemId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    fetchComments();
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open, fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(text.trim(), replyTo?.id ?? null);
      setText("");
      setReplyTo(null);
      onCommentCountChange?.(1);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 100);
    } catch {
      toast("댓글 등록에 실패했습니다", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteComment(id);
    onCommentCountChange?.(-1);
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
            댓글 {totalCount > 0 && <span className="text-text-3 font-normal">{totalCount}</span>}
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
            <div key={c.id} className="space-y-3">
              {/* Root comment */}
              <CommentRow
                comment={c}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onDelete={handleDelete}
              />

              {/* Replies — 1 level indent */}
              {(c.replies ?? []).length > 0 && (
                <div className="ml-[36px] space-y-3 border-l-2 border-border pl-3">
                  {(c.replies ?? []).map((reply) => (
                    <CommentRow
                      key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                  />
                ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border-t border-border">
            <span className="text-[12px] text-text-3 flex-1 truncate">
              <span className="text-accent font-semibold">@{replyTo.profile.handle}</span>에게 답글
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-text-3 hover:text-text-1 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2">
          <MentionInput
            value={text}
            onChange={setText}
            onSubmit={handleSubmit}
            placeholder={replyTo ? `@${replyTo.profile.handle}에게 답글...` : "댓글 입력..."}
            disabled={submitting}
            feedItemId={feedItemId}
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
