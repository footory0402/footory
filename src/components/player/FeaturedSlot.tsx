"use client";

import React from "react";
import Image from "next/image";

interface FeaturedSlotProps {
  clipId?: string;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  highlightStart?: number;
  highlightEnd?: number;
  durationSeconds?: number;
  tag?: string;
  sortOrder: number;
  onAdd?: () => void;
  onRemove?: (clipId: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function FeaturedSlot({
  clipId,
  thumbnailUrl,
  highlightStart,
  highlightEnd,
  durationSeconds,
  tag,
  sortOrder,
  onAdd,
  onRemove,
}: FeaturedSlotProps) {
  if (!clipId) {
    return (
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border-accent)] bg-[var(--accent-bg)]"
        style={{ aspectRatio: "16/10" }}
      >
        <span className="text-base">✨</span>
        <span className="text-xs font-medium text-accent">
          영상 {sortOrder} 추가
        </span>
      </button>
    );
  }

  const duration =
    highlightStart != null && highlightEnd != null
      ? highlightEnd - highlightStart
      : durationSeconds ?? 30;

  return (
    <div aria-label={`대표 영상 ${sortOrder}`} className="group relative overflow-hidden rounded-lg bg-gradient-to-b from-[#1a1a1e] to-[#121214]" style={{ aspectRatio: "16/10" }}>
      {/* Grass pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #D4A853 0px, transparent 1px, transparent 6px)",
        }}
      />

      {thumbnailUrl ? (
        <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 430px) 50vw, 215px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          🎬
        </div>
      )}

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Duration badge — bottom-left, Oswald */}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-stat text-[10px] font-medium text-white backdrop-blur-sm">
        {formatDuration(Math.round(duration))}
      </span>

      {/* Tag badge — top-right, gold */}
      {tag && (
        <span className="absolute top-1.5 right-1.5 rounded bg-accent/90 px-1.5 py-0.5 text-[9px] font-bold text-bg backdrop-blur-sm">
          {tag}
        </span>
      )}

      {/* BEST badge — top-left */}
      {sortOrder === 1 && (
        <span className="absolute top-1.5 left-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-bg">
          BEST
        </span>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(clipId)}
          className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
          style={tag ? { top: "28px" } : undefined}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default React.memo(FeaturedSlot);
