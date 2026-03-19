"use client";

import { useState } from "react";
import { PositionBadge } from "@/components/ui/Badge";
import { formatMonthRange, getMvpTierInfo } from "@/lib/mvp-scoring";
import type { ArchiveWeek } from "@/lib/types";
import MvpThumbnail from "./MvpThumbnail";

interface MvpArchiveProps {
  weeks: ArchiveWeek[];
  loading?: boolean;
}

export default function MvpArchive({ weeks, loading = false }: MvpArchiveProps) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(
    weeks[0]?.weekStart ?? null
  );

  if (loading) {
    return (
      <div className="space-y-3 px-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-card"
          />
        ))}
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="text-[28px]">📜</span>
        <p className="text-[13px] text-text-2">아직 MVP 기록이 없어요</p>
        <p className="text-[11px] text-text-3">
          첫 번째 월간 MVP 결과를 기다려주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {weeks.map((week) => {
        const isExpanded = expandedWeek === week.weekStart;
        const winner = week.results[0];

        return (
          <div
            key={week.weekStart}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Week header */}
            <button
              onClick={() =>
                setExpandedWeek(isExpanded ? null : week.weekStart)
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-alt"
            >
              <span className="text-[14px]">🏆</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-text-1">
                  {formatMonthRange(week.weekStart)}
                </p>
                {winner && (
                  <p className="text-[11px]">
                    <span className="text-text-2">MVP: {winner.playerName}</span>
                    {winner.teamName && (
                      <>
                        <span className="text-text-3/40"> · </span>
                        <span className="text-text-2">{winner.teamName}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`shrink-0 text-text-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded results */}
            {isExpanded && (
              <div className="border-t border-border">
                {week.results.map((result) => {
                  const tierInfo = getMvpTierInfo(result.mvpTier);
                  return (
                    <div
                      key={`${week.weekStart}-${result.rank}`}
                      className="flex items-center gap-3 border-b border-card-alt px-4 py-2.5 last:border-0"
                    >
                      {/* Rank */}
                      <span
                        className={`w-5 shrink-0 text-center font-stat text-[14px] font-bold ${
                          result.rank === 1 ? "text-accent" : result.rank <= 3 ? "text-text-1" : "text-text-3"
                        }`}
                      >
                        {result.rank}
                      </span>

                      {/* Thumbnail */}
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-card-alt">
                        {result.thumbnailUrl ? (
                          <MvpThumbnail
                            src={result.thumbnailUrl}
                            alt={`${result.playerName} MVP 클립`}
                            sizes="40px"
                            fallbackClassName="text-[16px]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[16px] opacity-30">
                            🎬
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15px] font-bold text-text-1">
                            {result.playerName}
                          </span>
                          {result.playerPosition && (
                            <PositionBadge
                              position={result.playerPosition}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-3">
                          {result.mvpCount > 0 && (
                            <span>🏆×{result.mvpCount}</span>
                          )}
                          {tierInfo && (
                            <span style={{ color: tierInfo.color }}>
                              {tierInfo.icon} {tierInfo.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <span className="shrink-0 font-stat text-[13px] font-bold text-text-1">
                        {result.totalScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
