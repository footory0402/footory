"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeed, type FeedItemEnriched } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import Link from "next/link";
import FeedCard from "./FeedCard";
import UploadNudge from "./UploadNudge";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ShareSheet from "@/components/social/ShareSheet";
import ClipPlayerSheet, { type PlayableClip } from "@/components/player/ClipPlayerSheet";

const CommentSheet = dynamic(() => import("@/components/social/CommentSheet"), { ssr: false });

interface FeedListProps {
  initialItems?: FeedItemEnriched[];
  initialNextCursor?: string | null;
  /** Whether the user has uploaded any clips. When false, show nudge at position 3. */
  showNudge?: boolean;
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-card-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-card-alt" />
              <div className="h-2.5 w-16 rounded bg-card-alt" />
            </div>
          </div>
          <div className="aspect-video w-full rounded-xl bg-card-alt" />
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
  const { items, loading, error, hasMore, loadMore, refresh, toggleKudos, updateKudosCount, updateCommentCount } = useFeed(
    initialItems,
    initialNextCursor
  );
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<FeedItemEnriched | null>(null);
  const [playerClips, setPlayerClips] = useState<PlayableClip[] | null>(null);

  const handlePlay = useCallback(async (item: FeedItemEnriched) => {
    const meta = item.metadata as Record<string, unknown>;
    let videoUrl = typeof meta.video_url === "string" ? meta.video_url : null;

    // 구버전 feed_items는 video_url 없음 → reference_id로 clip 조회
    if (!videoUrl && item.reference_id) {
      try {
        const res = await fetch(`/api/clips/${item.reference_id}`);
        if (res.ok) {
          const data = await res.json();
          videoUrl = data.clip?.video_url ?? null;
        }
      } catch {
        // ignore
      }
    }

    if (!videoUrl) return;
    setPlayerClips([{
      id: item.reference_id ?? item.id,
      videoUrl,
      thumbnailUrl: typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null,
      tag: Array.isArray(meta.tags) ? (meta.tags as string[])[0] : undefined,
      duration: typeof meta.duration === "number" ? meta.duration : undefined,
    }]);
  }, []);
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

  // Network / server error with no items to show
  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-text-1">피드를 불러오지 못했어요</p>
        <p className="text-xs text-text-3">{error}</p>
        <button
          onClick={refresh}
          className="mt-1 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg"
        >
          다시 시도
        </button>
      </div>
    );
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
          첫 영상을 올려 피드를 채워보세요
        </p>
        <Link
          href="/upload"
          className="mt-4 rounded-full bg-accent px-6 py-2.5 text-[13px] font-semibold text-bg"
        >
          영상 올리기
        </Link>
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
  const eagerImageIndexes = new Set(
    items
      .map((item, i) => ({
        i,
        hasThumbnail:
          (item.type === "highlight" || item.type === "featured_change") &&
          typeof (item.metadata as Record<string, unknown>)?.thumbnail_url === "string",
      }))
      .filter(({ hasThumbnail }) => hasThumbnail)
      .slice(0, 2)
      .map(({ i }) => i)
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-4 pb-4">
        {items.map((item, i) => (
          (() => {
            const meta = item.metadata as Record<string, unknown>;
            const hasThumbnail =
              (item.type === "highlight" || item.type === "featured_change") &&
              typeof meta.thumbnail_url === "string";
            const eagerImage = hasThumbnail && eagerImageIndexes.has(i);

            return (
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
                onShare={setShareTarget}
                onPlay={handlePlay}
                eagerImage={eagerImage}
              />
            </div>
          </div>
            );
          })()
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
        {!loading && !hasMore && items.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 py-6 text-center">
            <span className="text-[20px]">🎉</span>
            <p className="text-xs text-text-3">모든 영상을 확인했어요</p>
          </div>
        )}
        {/* Inline error banner for pagination failures */}
        {error && items.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
            <p className="text-xs text-text-3">{error}</p>
            <button onClick={refresh} className="text-xs font-semibold text-accent">
              다시 시도
            </button>
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

      {shareTarget && (
        <ShareSheet
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          shareUrl={typeof window !== "undefined" ? `${window.location.origin}/p/${shareTarget.playerHandle}` : `/p/${shareTarget.playerHandle}`}
          title={`${shareTarget.playerName}의 하이라이트 — Footory`}
        />
      )}

      {playerClips && (
        <ClipPlayerSheet
          clips={playerClips}
          onClose={() => setPlayerClips(null)}
        />
      )}
    </ErrorBoundary>
  );
}
