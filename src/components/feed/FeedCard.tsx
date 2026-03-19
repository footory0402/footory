"use client";

import { memo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { POSITION_COLORS } from "@/lib/constants";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import type { Position } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import ReactionPicker, { REACTIONS, type ReactionKey } from "@/components/social/ReactionPicker";

interface FeedCardProps {
  item: FeedItemEnriched;
  onKudos: (id: string, reaction?: string) => void;
  onComment?: (id: string) => void;
  onShare?: (item: FeedItemEnriched) => void;
  onPlay?: (item: FeedItemEnriched) => void | Promise<void>;
  eagerImage?: boolean;
}

interface FeedBodyExtras {
  kudosCount: number;
  commentCount: number;
  hasKudos: boolean;
  myReactionEmoji: string | null;
  onKudosTap: () => void;
  onKudosLongStart: () => void;
  onKudosLongEnd: () => void;
  onComment?: () => void;
  onPlay?: () => void | Promise<void>;
}

function FeedBody({
  item,
  eagerImage = false,
  extras,
}: {
  item: FeedItemEnriched;
  eagerImage?: boolean;
  extras: FeedBodyExtras;
}) {
  const meta = item.metadata as Record<string, unknown>;

  switch (item.type) {
    case "highlight": {
      const tags = (meta.tags as string[]) ?? [];
      const description = (meta.description as string) ?? (meta.memo as string) ?? null;
      const thumbnailUrl = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
      const videoUrl = typeof meta.video_url === "string" ? meta.video_url : null;
      const duration = typeof meta.duration === "number" ? meta.duration : null;
      const hasMedia = thumbnailUrl || videoUrl;

      return (
        <div>
          {description && (
            <p className="mb-2 text-[14px] text-text-2">{description}</p>
          )}
          {hasMedia ? (
            <>
              <button
                type="button"
                onClick={extras.onPlay}
                disabled={!extras.onPlay}
                className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.03] block"
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt="Highlight thumbnail"
                    fill
                    quality={60}
                    loading={eagerImage ? "eager" : "lazy"}
                    fetchPriority={eagerImage ? "high" : "auto"}
                    sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={videoUrl!}
                    preload="metadata"
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                {/* Duration */}
                {duration !== null && duration > 0 && (
                  <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white font-stat">
                    {duration >= 60
                      ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
                      : `${Math.floor(duration)}초`}
                  </span>
                )}
              </button>
              {/* Tags + Kudos/Comment — below thumbnail */}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-accent/[0.08] px-2 py-0.5 text-xs font-semibold text-accent">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 gap-3 ml-auto">
                  <button
                    onClick={extras.onKudosTap}
                    onMouseDown={extras.onKudosLongStart}
                    onMouseUp={extras.onKudosLongEnd}
                    onMouseLeave={extras.onKudosLongEnd}
                    onTouchStart={extras.onKudosLongStart}
                    onTouchEnd={extras.onKudosLongEnd}
                    className={`flex items-center gap-1 text-[13px] select-none transition-colors ${
                      extras.hasKudos ? "text-accent" : "text-text-3 hover:text-text-2"
                    }`}
                  >
                    <span className="text-text-3/50">{extras.myReactionEmoji ?? "👏"}</span>
                    {extras.kudosCount > 0 && <span className="text-accent font-semibold">{extras.kudosCount}</span>}
                  </button>
                  <button
                    onClick={extras.onComment}
                    className="flex items-center gap-1 text-[13px] text-text-3 hover:text-text-2 transition-colors"
                  >
                    <span className="text-text-3/50">💬</span>
                    {extras.commentCount > 0 && <span className="text-accent font-semibold">{extras.commentCount}</span>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No media at all: show tags below text */
            <>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "var(--accent-bg)", color: "var(--color-accent)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    case "featured_change": {
      const thumbnailUrl = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
      return (
        <div>
          <p className="text-[14px] text-text-1">대표 클립을 변경했어요</p>
          {thumbnailUrl && (
            <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.03]">
              <Image
                src={thumbnailUrl}
                alt="Featured clip"
                fill
                quality={60}
                loading={eagerImage ? "eager" : "lazy"}
                fetchPriority={eagerImage ? "high" : "auto"}
                sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      );
    }

    case "stat":
      return (
        <div className="rounded-xl bg-card-alt p-3">
          <p className="text-[14px] text-text-1 mb-1">새 기록을 등록했어요</p>
          <div className="flex items-baseline gap-2">
            <span className="font-stat text-[24px] font-bold text-accent">{meta.value as number}</span>
            <span className="text-[13px] text-text-3">{meta.unit as string}</span>
          </div>
          <p className="text-[12px] text-text-3 mt-0.5">{meta.stat_label as string}</p>
        </div>
      );

    case "top_clip":
      return (
        <p className="text-[14px] text-text-1">
          <span className="text-accent font-semibold">{meta.tag_name as string}</span> 태그의 대표 클립을 설정했어요
        </p>
      );

    case "season":
      return (
        <div className="rounded-xl bg-card-alt p-3">
          <p className="text-[14px] text-text-1">새 시즌을 추가했어요</p>
          <p className="text-[13px] text-text-2 mt-1">{meta.year as number} · {meta.team_name as string}</p>
        </div>
      );

    default:
      return <p className="text-[14px] text-text-3">활동이 있어요</p>;
  }
}

export default memo(function FeedCard({ item, onKudos, onComment, onShare, onPlay, eagerImage = false }: FeedCardProps) {
  const posColor = POSITION_COLORS[item.playerPosition as Position] ?? "#A1A1AA";

  const [showPicker, setShowPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleKudosTap = useCallback(() => {
    onKudos(item.id, "clap");
  }, [item.id, onKudos]);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleReactionSelect = useCallback((reaction: ReactionKey) => {
    onKudos(item.id, reaction);
    setShowPicker(false);
  }, [item.id, onKudos]);

  const myReactionEmoji = item.myReaction
    ? REACTIONS.find((r) => r.key === item.myReaction)?.emoji ?? "👏"
    : null;

  const meta = item.metadata as Record<string, unknown>;
  const isHighlightWithVideo =
    item.type === "highlight" &&
    (typeof meta.thumbnail_url === "string" || typeof meta.video_url === "string");

  const extras: FeedBodyExtras = {
    kudosCount: item.kudosCount,
    commentCount: item.commentCount,
    hasKudos: item.hasKudos,
    myReactionEmoji,
    onKudosTap: handleKudosTap,
    onKudosLongStart: handleLongPressStart,
    onKudosLongEnd: handleLongPressEnd,
    onComment: onComment ? () => onComment(item.id) : undefined,
    onPlay: onPlay ? () => onPlay(item) : undefined,
  };

  return (
    <div className="card-elevated p-4 transition-transform duration-100 active:scale-[0.98]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/p/${item.playerHandle}`} aria-label={`${item.playerName} 프로필`}>
          <Avatar name={item.playerName} size="sm" imageUrl={item.playerAvatarUrl ?? undefined} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={`/p/${item.playerHandle}`} className="text-[15px] font-bold text-text-1 truncate hover:text-accent transition-colors" style={{ letterSpacing: "-0.3px" }}>
              {item.playerName}
            </Link>
            <span className="shrink-0 text-[10px] text-text-3">›</span>
            <span className="shrink-0 text-[10px]" style={{ color: posColor }}>{item.playerPosition}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {item.teamName && (
              <>
                <span className="text-accent font-medium">{item.teamName}</span>
                <span className="text-text-3/40">·</span>
              </>
            )}
            <span className="text-text-3/50">{timeAgo(item.created_at)}</span>
          </div>
        </div>
        {/* Share button */}
        <button
          onClick={() => onShare?.(item)}
          className="shrink-0 p-1.5 text-text-3 hover:text-text-1 transition-colors"
          aria-label="공유"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="relative">
        <FeedBody item={item} eagerImage={eagerImage} extras={extras} />
        {/* Reaction picker — shown above thumbnail for highlight cards */}
        {showPicker && (
          <div ref={pickerRef} className="absolute bottom-full mb-2 left-0 z-50">
            <ReactionPicker
              onSelect={handleReactionSelect}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>

      {/* Footer — only for non-highlight types (or highlight without video) */}
      {!isHighlightWithVideo && (
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-white/5 pt-3 relative">
          <button
            onClick={handleKudosTap}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            className={`flex items-center gap-1 text-[13px] transition-colors select-none ${
              item.hasKudos ? "text-accent" : "text-text-3 hover:text-text-2"
            }`}
          >
            <span className="text-text-3/50">{myReactionEmoji ?? "👏"}</span>
            {item.kudosCount > 0 && <span className="text-accent font-semibold">{item.kudosCount}</span>}
          </button>

          <button
            onClick={() => onComment?.(item.id)}
            className="flex items-center gap-1 text-[13px] text-text-3 hover:text-text-2 transition-colors"
          >
            <span className="text-text-3/50">💬</span>
            {item.commentCount > 0 && <span className="text-accent font-semibold">{item.commentCount}</span>}
          </button>
        </div>
      )}
    </div>
  );
});
