"use client";

import Link from "next/link";
import Image from "next/image";
import type { MvpLastMonthResult } from "@/lib/server/mvp";
import { getMvpTierInfo } from "@/lib/mvp-scoring";

interface MvpResultBannerProps {
  results: MvpLastMonthResult[];
  lastMonthStart: string;
  onDismiss: () => void;
}

const RANK_CONFIG = [
  { label: "🥇 1위 MVP", accent: "var(--color-accent)", glow: "rgba(212,168,83,0.15)" },
  { label: "🥈 2위", accent: "#A8A8B3", glow: "rgba(168,168,179,0.1)" },
  { label: "🥉 3위", accent: "#CD7F32", glow: "rgba(205,127,50,0.1)" },
];

export default function MvpResultBanner({
  results,
  lastMonthStart,
  onDismiss,
}: MvpResultBannerProps) {
  if (!results.length) return null;

  const monthLabel = `${lastMonthStart.slice(0, 7).replace("-", "년 ")}월`;
  const winner = results[0];

  return (
    <div
      className="mb-4 overflow-hidden rounded-[14px]"
      style={{ background: "rgba(212,168,83,0.06)", border: "1px solid rgba(212,168,83,0.2)" }}
    >
      {/* 골드 상단 바 */}
      <div className="h-[2px]" style={{ background: "var(--accent-gradient)" }} />

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent opacity-80">
            Monthly MVP Result
          </p>
          <p className="text-sm font-bold text-text-1">{monthLabel} MVP 발표 🏆</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full text-text-3 hover:text-text-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {/* 수상자 목록 */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        {results.map((result, i) => {
          const cfg = RANK_CONFIG[i] ?? RANK_CONFIG[2];
          const tierInfo = getMvpTierInfo(result.mvpTier);

          return (
            <Link
              key={result.profileId}
              href={`/p/${result.playerHandle}`}
              className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 active:opacity-70"
              style={{ background: cfg.glow, border: `1px solid ${cfg.accent}22` }}
            >
              {/* 썸네일 */}
              <div
                className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[6px]"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {result.thumbnailUrl ? (
                  <Image
                    src={result.thumbnailUrl}
                    alt={result.playerName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[16px] opacity-30">
                    🎬
                  </div>
                )}
                {/* 순위 뱃지 */}
                <div
                  className="absolute bottom-0.5 left-0.5 rounded-sm px-1 text-[8px] font-bold"
                  style={{ background: cfg.accent, color: "#0A0A0C" }}
                >
                  {i + 1}위
                </div>
              </div>

              {/* 선수 정보 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[13px] font-bold text-text-1">{result.playerName}</p>
                  {tierInfo && (
                    <span className="shrink-0 text-[11px]">{tierInfo.icon}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {result.teamName && (
                    <span className="text-[10px] text-text-3">{result.teamName}</span>
                  )}
                  {result.voteCount > 0 && (
                    <span className="text-[10px] text-text-3">
                      🗳 <span className="font-stat font-bold text-text-2">{result.voteCount}</span>표
                    </span>
                  )}
                </div>
              </div>

              {/* 순위 라벨 */}
              <p className="shrink-0 text-[11px] font-bold" style={{ color: cfg.accent }}>
                {cfg.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* 아카이브 링크 */}
      <div
        className="border-t px-4 py-2.5 text-center"
        style={{ borderColor: "rgba(212,168,83,0.1)" }}
      >
        <p className="text-[10px] text-text-3">
          이 배너는 매월 7일까지 표시됩니다 ·{" "}
          <span className="text-accent underline">전체 아카이브 보기</span>
        </p>
      </div>
    </div>
  );
}
