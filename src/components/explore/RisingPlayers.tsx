"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { Position } from "@/lib/constants";
import { getPositionBadgeStyle } from "@/components/ui/Badge";
import { useRisingPlayers } from "@/hooks/useDiscover";

export default function RisingPlayers() {
  const { items, loading } = useRisingPlayers();

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] w-[120px] shrink-0 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-8 text-center px-4">
        <span className="text-2xl mb-2">🔍</span>
        <p className="text-sm text-text-2">아이의 팀 동료를 찾아보세요</p>
        <p className="text-xs text-text-3 mt-1">검색창에서 선수나 팀을 검색해보세요</p>
      </div>
    );
  }

  const visibleItems = items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {visibleItems.map((p) => {
        const posStyle = p.position ? getPositionBadgeStyle(p.position) : null;
        return (
          <Link
            key={p.profile_id}
            href={`/p/${p.handle}`}
            className="card-elevated flex w-[120px] shrink-0 flex-col items-center gap-1.5 p-3 transition-transform duration-100 active:scale-[0.98]"
          >
            <Avatar
              name={p.name}
              size="md"
              level={p.level}
              imageUrl={p.avatar_url ?? undefined}
            />
            <span className="text-sm font-bold text-text-1 text-center truncate w-full" style={{ letterSpacing: "-0.3px" }}>
              {p.name}
            </span>
            {p.position && posStyle && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-stat font-bold"
                style={{ color: posStyle.text, backgroundColor: posStyle.bg, border: `1px solid ${posStyle.border}` }}
              >
                {p.position}
              </span>
            )}
          </Link>
        );
      })}
      {hasMore && (
        <div className="card-elevated flex w-[80px] shrink-0 flex-col items-center justify-center gap-1.5 text-text-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 8 16 12 12 16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-[10px] font-medium text-center">더보기</span>
        </div>
      )}
    </div>
  );
}
