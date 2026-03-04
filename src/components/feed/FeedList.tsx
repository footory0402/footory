"use client";

import { useEffect, useRef, useMemo } from "react";
import { useFeed, type FeedItemEnriched } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import FeedCard from "./FeedCard";
import dynamic from "next/dynamic";

const CommentSheet = dynamic(() => import("@/components/social/CommentSheet"), { ssr: false });
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useState } from "react";

interface FeedListProps {
  initialItems?: FeedItemEnriched[];
  initialNextCursor?: string | null;
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[12px] bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-card-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-card-alt" />
              <div className="h-2.5 w-16 rounded bg-card-alt" />
            </div>
          </div>
          <div className="aspect-video w-full rounded-[10px] bg-card-alt" />
        </div>
      ))}
    </div>
  );
}

export default function FeedList({ initialItems = [], initialNextCursor = null }: FeedListProps) {
  const { items, loading, hasMore, loadMore, toggleKudos, updateKudosCount, updateCommentCount } = useFeed(
    initialItems,
    initialNextCursor
  );
  const [commentTarget, setCommentTarget] = useState<string | null>(null);

  const feedItemIds = useMemo(() => items.map((i) => i.id), [items]);

  useRealtimeFeed({
    feedItemIds,
    onKudosChange: updateKudosCount,
  });

  // Infinite scroll
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerInstanceRef.current?.disconnect();
    if (loading || !hasMore || !lastItemRef.current) return;
    observerInstanceRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.5 }
    );
    observerInstanceRef.current.observe(lastItemRef.current);
    return () => observerInstanceRef.current?.disconnect();
  }, [loading, hasMore, loadMore, items]);

  // Show skeleton only when no initial data and still loading
  if (loading && items.length === 0) {
    return <FeedSkeleton />;
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-3xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
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
    <ErrorBoundary>
      <div className="flex flex-col gap-3 pb-4">
        {items.map((item, i) => (
          <div key={item.id} ref={i === items.length - 1 ? lastItemRef : null}>
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
          onCommentCountChange={(delta) => updateCommentCount(commentTarget, delta)}
        />
      )}
    </ErrorBoundary>
  );
}
