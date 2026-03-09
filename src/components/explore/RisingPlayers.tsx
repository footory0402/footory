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
          <div key={i} className="h-[160px] w-[120px] shrink-0 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-card py-6">
        <p className="text-[13px] text-text-3">떠오르는 선수가 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {items.map((p) => {
        const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
        return (
          <div
            key={p.profile_id}
            className="card-elevated flex w-[120px] h-[160px] shrink-0 flex-col items-center justify-between p-4"
          >
            <Link href={`/p/${p.handle}`} className="flex flex-col items-center gap-1.5">
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
                <span className="text-[10px]" style={{ color: posColor }}>
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
    </div>
  );
}
