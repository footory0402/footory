"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeed, type FeedItemEnriched } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import FeedCard from "./FeedCard";
import UploadNudge from "./UploadNudge";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const CommentSheet = dynamic(() => import("@/components/social/CommentSheet"), { ssr: false });

interface FeedListProps {
  initialItems?: FeedItemEnriched[];
  initialNextCursor?: string | null;
  /** Whether the user has uploaded any clips. When false, show nudge at position 3. */
  showNudge?: boolean;
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

export default function FeedList({
  initialItems = [],
  initialNextCursor = null,
  showNudge = false,
}: FeedListProps) {
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

  const setLastItemRef = useCallback((node: HTMLDivElement | null) => {
    observerInstanceRef.current?.disconnect();
    lastItemRef.current = node;

    if (loading || !hasMore || !node) return;

    observerInstanceRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.5 }
    );
    observerInstanceRef.current.observe(node);
  }, [hasMore, loadMore, loading]);

  useEffect(
    () => () => {
      observerInstanceRef.current?.disconnect();
    },
    []
  );

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
        <p className="mt-1 text-[13px] text-text-3 text-center">
          곧 추천 콘텐츠가 채워질 거예요
        </p>
        {showNudge && (
          <div className="mt-6 w-full">
            <UploadNudge />
          </div>
        )}
      </div>
    );
  }

  // Nudge insertion position (0-indexed, after 2 items = position 3)
  const NUDGE_POSITION = 2;

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-3 pb-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
          >
            {/* Insert nudge before the 3rd item (index 2) */}
            {showNudge && i === NUDGE_POSITION && (
              <div className="mb-3">
                <UploadNudge />
              </div>
            )}
            <div ref={i === items.length - 1 ? setLastItemRef : null}>
              <FeedCard
                item={item}
                onKudos={toggleKudos}
                onComment={setCommentTarget}
              />
            </div>
          </div>
        ))}
        {/* If feed has fewer than 3 items, show nudge at the end */}
        {showNudge && items.length > 0 && items.length < NUDGE_POSITION + 1 && (
          <UploadNudge />
        )}
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
