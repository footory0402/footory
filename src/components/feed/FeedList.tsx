"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useFeed } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import FeedCard from "./FeedCard";
import CommentSheet from "@/components/social/CommentSheet";

export default function FeedList() {
  const { items, loading, hasMore, refresh, loadMore, toggleKudos, updateKudosCount } = useFeed();
  const observerRef = useRef<HTMLDivElement>(null);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);

  const feedItemIds = useMemo(() => items.map((i) => i.id), [items]);

  useRealtimeFeed({
    feedItemIds,
    onKudosChange: updateKudosCount,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Infinite scroll
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { threshold: 0.5 }
      );
      if (node) observer.observe(node);
      return () => observer.disconnect();
    },
    [loading, hasMore, loadMore]
  );

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-3xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <p className="mt-4 text-[15px] font-semibold text-text-1">피드가 비어있어요</p>
        <p className="mt-1 text-[13px] text-text-3">선수를 팔로우하면 피드가 채워집니다</p>
      </div>
    );
  }

  return (
    <>
      <div ref={observerRef} className="flex flex-col gap-3 pb-4">
        {items.map((item, i) => (
          <div key={item.id} ref={i === items.length - 1 ? lastItemRef : undefined}>
            <FeedCard
              item={item}
              onKudos={toggleKudos}
              onComment={setCommentTarget}
            />
          </div>
        ))}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>

      {commentTarget && (
        <CommentSheet
          feedItemId={commentTarget}
          open={!!commentTarget}
          onClose={() => setCommentTarget(null)}
        />
      )}
    </>
  );
}
