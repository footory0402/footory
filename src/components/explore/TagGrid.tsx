"use client";

import { useState } from "react";
import Link from "next/link";
import { SKILL_TAGS } from "@/lib/constants";
import { useTagClips } from "@/hooks/useDiscover";

export default function TagGrid() {
  const [selectedTag, setSelectedTag] = useState<string>(SKILL_TAGS[0].dbName);
  const { items, loading } = useTagClips(selectedTag);

  return (
    <div>
      {/* Tag filter carousel */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SKILL_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.dbName)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              selectedTag === tag.dbName
                ? "bg-accent text-bg"
                : "bg-card-alt text-text-2 active:bg-elevated"
            }`}
          >
            {tag.emoji} {tag.label}
          </button>
        ))}
      </div>

      {/* Thumbnail grid */}
      {loading ? (
        <div className="mt-3 grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[6px] bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center rounded-[12px] bg-card py-10 mt-3">
          <p className="text-[13px] text-text-3">이 태그의 클립이 없어요</p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-1">
          {items.map((clip) => (
            <Link
              key={clip.id}
              href={`/p/${clip.owner_handle}`}
              className="group relative aspect-square overflow-hidden rounded-[6px] bg-card"
            >
              {clip.thumbnail_url ? (
                <img
                  src={clip.thumbnail_url}
                  alt={`${clip.owner_name} clip`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-active:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-card-alt">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              {/* Duration badge */}
              {clip.duration_seconds && (
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white">
                  {Math.floor(clip.duration_seconds)}초
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
