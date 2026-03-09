"use client";

import Link from "next/link";
import Image from "next/image";
import { useTeamRanking } from "@/hooks/useDiscover";

interface TeamRankingProps {
  /** When true, shows as horizontal carousel (for overview tab) */
  compact?: boolean;
}

export default function TeamRanking({ compact = false }: TeamRankingProps) {
  const { items, loading } = useTeamRanking();

  if (loading) {
    if (compact) {
      return (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[100px] w-[160px] shrink-0 animate-pulse rounded-[12px] bg-card" />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse border-b border-card-alt bg-card first:rounded-t-[12px] last:rounded-b-[12px] last:border-b-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[12px] bg-card py-8 text-center">
        <span className="text-2xl mb-2">🏟</span>
        <p className="text-sm text-text-3">팀을 검색해보세요</p>
      </div>
    );
  }

  // Compact carousel mode
  if (compact) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.slice(0, 8).map((t, idx) => (
          <Link
            key={t.team_id}
            href={`/team/${t.team_id}`}
            className="flex w-[160px] shrink-0 flex-col items-center gap-2 rounded-[12px] bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[14px] font-bold ${
                  idx === 0 ? "text-accent" : idx < 3 ? "text-text-1" : "text-text-3"
                }`}
                style={{ fontFamily: "var(--font-stat)" }}
              >
                {idx + 1}
              </span>
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card-alt text-[18px] shrink-0">
                {t.logo_url ? (
                  <Image
                    src={t.logo_url}
                    alt={t.name}
                    fill
                    sizes="40px"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  "⚽"
                )}
              </div>
            </div>
            <span className="text-[13px] font-bold text-text-1 text-center truncate w-full">
              {t.name}
            </span>
            <span className="text-xs text-text-3">
              {t.city && <><span className="text-text-3">{t.city}</span><span className="text-text-3/40"> · </span></>}{t.member_count}명
            </span>
          </Link>
        ))}
      </div>
    );
  }

  // Full list mode
  return (
    <div className="rounded-[12px] bg-card overflow-hidden">
      {items.map((t, idx) => (
        <Link
          key={t.team_id}
          href={`/team/${t.team_id}`}
          className="flex items-center gap-3 border-b border-card-alt px-4 py-3 last:border-b-0 active:bg-card-alt transition-colors"
        >
          {/* Rank */}
          <span
            className={`w-6 text-center text-[16px] font-bold tabular-nums shrink-0 ${
              idx === 0 ? "text-accent" : idx < 3 ? "text-text-1" : "text-text-3"
            }`}
            style={{ fontFamily: "var(--font-stat)" }}
          >
            {idx + 1}
          </span>

          {/* Logo */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card-alt text-[16px] shrink-0">
            {t.logo_url ? (
              <Image
                src={t.logo_url}
                alt={t.name}
                fill
                sizes="40px"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              "⚽"
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <span className="text-[15px] font-bold text-text-1 truncate block">
              {t.name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {t.city && (
                <span className="text-xs text-text-3">{t.city}</span>
              )}
              <span className="text-xs text-text-3"><span className="text-text-1 font-medium">{t.member_count}</span>명</span>
            </div>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <span
              className="text-[14px] font-bold text-accent tabular-nums"
              style={{ fontFamily: "var(--font-stat)" }}
            >
              {t.activity_score}
            </span>
            <span className="block text-[10px] text-text-3">활동점수</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
