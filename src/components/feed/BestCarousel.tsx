"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BestClipItem } from "@/lib/server/feed";

interface BestCarouselProps {
  items: BestClipItem[];
}

function BestCarouselCard({ item }: { item: BestClipItem }) {
  return (
    <Link
      href={`/p/${item.playerHandle}`}
      className="group relative block shrink-0 overflow-hidden rounded-xl bg-card"
      style={{ width: 120, height: 160 }}
    >
      {/* Thumbnail */}
      {item.thumbnailUrl ? (
        <Image
          src={item.thumbnailUrl}
          alt={`${item.playerName} 하이라이트`}
          width={120}
          height={160}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-card-alt">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-text-3"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Kudos badge (top-right) */}
      {item.kudosCount > 0 && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-accent backdrop-blur-sm">
          <span>&#x1F44F;</span>
          <span>{item.kudosCount}</span>
        </div>
      )}

      {/* Player info (bottom) */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="truncate text-[12px] font-bold leading-tight text-text-1">
          {item.playerName}
        </p>
        {item.tag && (
          <p className="mt-0.5 truncate text-[10px] text-text-3">
            {item.tag}
          </p>
        )}
      </div>
    </Link>
  );
}

export default memo(function BestCarousel({ items }: BestCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-4">
      {/* Section header */}
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <span className="text-[14px]">&#x1F3C6;</span>
        <h2 className="text-[14px] font-bold text-text-1">
          이번 주 베스트
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
      </div>

      {/* Horizontal scroll container */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, idx) => (
          <BestCarouselCard key={`${item.feedItemId}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
});
