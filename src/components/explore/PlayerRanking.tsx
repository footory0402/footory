"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { POSITION_COLORS, MVP_TIERS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import { usePlayerRanking, type PlayerSortKey } from "@/hooks/useDiscover";

const SORT_OPTIONS: { key: PlayerSortKey; label: string }[] = [
  { key: "popularity", label: "인기순" },
  { key: "followers", label: "팔로워순" },
  { key: "mvp", label: "MVP횟수순" },
];

interface PlayerRankingProps {
  /** When true, shows as compact carousel (for overview tab) */
  compact?: boolean;
  /** Filter by position (FW, MF, DF, GK) */
  positionFilter?: string;
}

export default function PlayerRanking({ compact = false, positionFilter }: PlayerRankingProps) {
  const [sort, setSort] = useState<PlayerSortKey>("popularity");
  const { items, loading } = usePlayerRanking(sort);

  if (loading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse border-b border-card-alt bg-card first:rounded-t-[12px] last:rounded-b-[12px] last:border-b-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[12px] bg-card py-8">
        <p className="text-[13px] text-text-3">아직 랭킹 데이터가 없어요</p>
      </div>
    );
  }

  const filtered = positionFilter
    ? items.filter((i) => i.position === positionFilter)
    : items;
  const displayed = compact ? filtered.slice(0, 5) : filtered;

  return (
    <div>
      {/* Sort tabs (full mode only) */}
      {!compact && (
        <div className="flex gap-2 mb-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                sort === opt.key
                  ? "bg-accent text-bg"
                  : "bg-card-alt text-text-2 active:bg-elevated"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[12px] bg-card overflow-hidden">
        {displayed.map((item, idx) => (
          <PlayerRankingRow key={item.profile_id} item={item} rank={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function PlayerRankingRow({
  item,
  rank,
}: {
  item: ReturnType<typeof usePlayerRanking>["items"][number];
  rank: number;
}) {
  const posColor = POSITION_COLORS[item.position as Position] ?? "#A1A1AA";
  const mvpTier = MVP_TIERS.find((t) => t.tier === item.mvp_tier);

  return (
    <div className="flex items-center gap-3 border-b border-card-alt px-4 py-3 last:border-b-0">
      {/* Rank number */}
      <span
        className="w-6 text-center text-[16px] font-bold tabular-nums shrink-0"
        style={{ fontFamily: "var(--font-stat)" }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <Link href={`/p/${item.handle}`} className="shrink-0">
        <Avatar
          name={item.name}
          size="sm"
          level={item.level}
          imageUrl={item.avatar_url ?? undefined}
        />
      </Link>

      {/* Info */}
      <Link href={`/p/${item.handle}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-text-1 truncate">
            {item.name}
          </span>
          {item.position && (
            <span
              className="rounded-full px-1.5 py-px text-[10px] font-medium"
              style={{ color: posColor, backgroundColor: `${posColor}15` }}
            >
              {item.position}
            </span>
          )}
          {item.mvp_count > 0 && mvpTier && (
            <span className="text-[11px]" title={`MVP ${item.mvp_count}회`}>
              {mvpTier.icon}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.team_name && (
            <span className="text-[11px] text-text-3 truncate">{item.team_name}</span>
          )}
          <span className="text-[11px] text-text-3">
            {item.followers_count > 0 && `팔로워 ${item.followers_count}`}
          </span>
        </div>
      </Link>

      {/* Follow button */}
      <div className="shrink-0">
        <FollowButton targetId={item.profile_id} size="sm" />
      </div>
    </div>
  );
}
