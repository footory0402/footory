"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { POSITIONS, POSITION_COLORS, MVP_TIERS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import { getPositionBadgeStyle } from "@/components/ui/Badge";
import { usePlayerRanking, type PlayerSortKey } from "@/hooks/useDiscover";
import { useProfileContext } from "@/providers/ProfileProvider";

const SORT_OPTIONS: { key: PlayerSortKey; label: string }[] = [
  { key: "popularity", label: "인기순" },
  { key: "followers", label: "팔로워순" },
  { key: "mvp", label: "MVP횟수순" },
];

const POSITION_LABELS_SHORT: Record<Position, string> = {
  FW: "공격수",
  MF: "미드필더",
  DF: "수비수",
  GK: "골키퍼",
};

interface PlayerRankingProps {
  /** When true, shows as compact carousel (for overview tab) */
  compact?: boolean;
}

export default function PlayerRanking({ compact = false }: PlayerRankingProps) {
  const [sort, setSort] = useState<PlayerSortKey>("popularity");
  const [posFilter, setPosFilter] = useState<Position | null>(null);
  const { items, loading } = usePlayerRanking(sort);
  const { profile } = useProfileContext();

  if (loading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse border-b border-white/5 bg-card first:rounded-t-[12px] last:rounded-b-[12px] last:border-b-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-8 text-center">
        <span className="text-2xl mb-2">📊</span>
        <p className="text-sm text-text-3">아직 데이터를 모으고 있어요</p>
      </div>
    );
  }

  const filtered = posFilter ? items.filter((item) => item.position === posFilter) : items;
  const rankedItems = filtered
    .map((item, index) => ({ item, rank: index + 1 }))
    .filter(({ item }) => item.profile_id !== profile?.id);
  const displayed = compact ? rankedItems.slice(0, 5) : rankedItems;

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-8 text-center">
        <span className="mb-2 text-2xl">📊</span>
        <p className="text-sm text-text-3">다른 선수 데이터를 모으고 있어요</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort tabs + position filter */}
      {!compact && (
        <div className="flex gap-2 mb-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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

      {/* Position chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setPosFilter(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            posFilter === null
              ? "bg-accent text-bg"
              : "bg-card-alt text-text-2 active:bg-elevated"
          }`}
        >
          전체
        </button>
        {POSITIONS.map((pos) => {
          const active = posFilter === pos;
          const color = POSITION_COLORS[pos];
          return (
            <button
              key={pos}
              onClick={() => setPosFilter(active ? null : pos)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: `${color}22`, color, border: `1px solid ${color}50` }
                  : { backgroundColor: "var(--color-card-alt)", color: "#71717A" }
              }
            >
              {POSITION_LABELS_SHORT[pos]}
            </button>
          );
        })}
      </div>

      <div className="card-elevated overflow-hidden">
        {displayed.map(({ item, rank }) => (
          <PlayerRankingRow key={item.profile_id} item={item} rank={rank} />
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
  const posStyle = item.position ? getPositionBadgeStyle(item.position) : null;
  const mvpTier = MVP_TIERS.find((t) => t.tier === item.mvp_tier);

  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5 last:border-b-0 transition-transform duration-100 active:scale-[0.98]">
      {/* Rank number */}
      <span
        className={`w-6 text-center font-stat text-base font-bold tabular-nums shrink-0 ${
          rank === 1 ? "text-accent" : rank <= 3 ? "text-text-1" : "text-text-3"
        }`}
      >
        {rank}
      </span>

      {/* Avatar — 1st place gets gold ring */}
      <Link href={`/p/${item.handle}`} className="shrink-0">
        <div className={rank === 1 ? "rounded-full ring-2 ring-accent/30 ring-offset-2 ring-offset-bg" : ""}>
          <Avatar
            name={item.name}
            size="sm"
            imageUrl={item.avatar_url ?? undefined}
          />
        </div>
      </Link>

      {/* Info */}
      <Link href={`/p/${item.handle}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-text-1 truncate" style={{ letterSpacing: "-0.3px" }}>
            {item.name}
          </span>
          {item.position && posStyle && (
            <span
              className="rounded-md text-[10px] font-stat px-2 py-0.5 font-bold"
              style={{ color: posStyle.text, backgroundColor: posStyle.bg, border: `1px solid ${posStyle.border}` }}
            >
              {item.position}
            </span>
          )}
          {item.mvp_count > 0 && mvpTier && (
            <span className="text-xs" title={`MVP ${item.mvp_count}회`}>
              {mvpTier.icon}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.team_name && (
            <span className="text-xs text-accent font-medium truncate">{item.team_name}</span>
          )}
          {item.followers_count > 0 && (
            <span className="text-xs text-text-3">
              팔로워 <span className="text-text-1 font-bold">{item.followers_count}</span>
            </span>
          )}
        </div>
      </Link>

      {/* Follow button */}
      <div className="shrink-0">
        <FollowButton targetId={item.profile_id} size="sm" />
      </div>
    </div>
  );
}
