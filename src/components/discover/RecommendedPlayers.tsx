"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { POSITION_COLORS, LEVELS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import type { DiscoverPlayer } from "@/types/discover";

interface RecommendedPlayersProps {
  players: DiscoverPlayer[];
  loading: boolean;
}

export default function RecommendedPlayers({ players, loading }: RecommendedPlayersProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 w-24 shrink-0 animate-pulse rounded-[12px] bg-card" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[12px] bg-card py-6">
        <p className="text-[13px] text-text-3">추천 선수가 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {players.map((p) => {
        const lvl = LEVELS[Math.min(p.level ?? 1, 5) - 1];
        const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
        return (
          <Link
            key={p.id}
            href={`/p/${p.handle}`}
            className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-[12px] bg-card p-3"
          >
            <Avatar name={p.name} size="sm" level={p.level} imageUrl={p.avatar_url ?? undefined} />
            <span className="text-[12px] font-bold text-text-1 text-center truncate w-full">
              {p.name}
            </span>
            <div className="flex items-center gap-1">
              {p.position && (
                <span className="text-[10px]" style={{ color: posColor }}>{p.position}</span>
              )}
              <span className="text-[10px]" style={{ color: lvl.color }}>{lvl.icon}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
