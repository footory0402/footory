"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { POSITION_COLORS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import { useRisingPlayers } from "@/hooks/useDiscover";

export default function RisingPlayers() {
  const { items, loading } = useRisingPlayers();

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[148px] w-[112px] shrink-0 animate-pulse rounded-xl bg-card" />
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
        const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
        return (
          <div
            key={p.profile_id}
            className="card-elevated flex w-[112px] shrink-0 flex-col items-center gap-2 p-3"
          >
            <Link href={`/p/${p.handle}`} className="flex flex-col items-center gap-1.5 w-full">
              <Avatar
                name={p.name}
                size="md"
                level={p.level}
                imageUrl={p.avatar_url ?? undefined}
              />
              <span className="text-sm font-semibold text-text-1 text-center truncate w-full">
                {p.name}
              </span>
              {p.position && (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-stat font-medium"
                  style={{ color: posColor, backgroundColor: `${posColor}15` }}
                >
                  {p.position}
                </span>
              )}
              {p.weekly_change > 0 && (
                <span className="text-[10px] font-medium text-green">
                  인기 +{p.weekly_change}
                </span>
              )}
            </Link>
            <FollowButton targetId={p.profile_id} size="sm" />
          </div>
        );
      })}
      {hasMore && (
        <div className="card-elevated flex w-[80px] h-[152px] shrink-0 flex-col items-center justify-center gap-1.5 text-text-3">
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
