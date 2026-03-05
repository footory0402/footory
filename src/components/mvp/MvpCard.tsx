"use client";

import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { PositionBadge, LevelBadge } from "@/components/ui/Badge";
import { getMvpTierInfo } from "@/lib/mvp-scoring";
import type { Position, MvpTierKey } from "@/lib/constants";

export interface MvpCardData {
  rank: number;
  profileId: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl?: string;
  playerLevel: number;
  playerPosition: Position | null;
  teamName?: string;
  thumbnailUrl?: string;
  totalScore: number;
  autoScore: number;
  voteScore: number;
  voteCount: number;
  mvpCount: number;
  mvpTier: MvpTierKey | null;
  weekRange: string;
}

interface MvpCardProps {
  data: MvpCardData;
  className?: string;
}

export default function MvpCard({ data, className = "" }: MvpCardProps) {
  const tierInfo = getMvpTierInfo(data.mvpTier);

  return (
    <div
      className={`animate-fade-up overflow-hidden ${className}`}
      style={{
        background:
          "linear-gradient(135deg, #1a1510 0%, #161618 50%, #1a1510 100%)",
        border: "1px solid rgba(212,168,83,0.3)",
        borderRadius: 14,
        boxShadow: "0 0 20px rgba(212,168,83,0.1)",
      }}
    >
      {/* Header label */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span
          className="font-brand text-[12px] font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--color-accent)" }}
        >
          🏆 WEEKLY MVP
        </span>
        <span className="text-[10px] text-text-3">{data.weekRange}</span>
      </div>

      {/* Thumbnail */}
      <div className="mx-auto mt-3 px-4">
        <div
          className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg"
          style={{ border: "2px solid var(--color-accent)" }}
        >
          {data.thumbnailUrl ? (
            <Image
              src={data.thumbnailUrl}
              alt={`${data.playerName} MVP 클립`}
              fill
              quality={60}
              sizes="200px"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-card-alt">
              <span className="text-[48px] opacity-30">🏆</span>
            </div>
          )}

          {/* Rank badge */}
          <div
            className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full font-stat text-[14px] font-bold"
            style={{
              background: "var(--accent-gradient)",
              color: "#0C0C0E",
            }}
          >
            {data.rank}
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: "rgba(0,0,0,0.6)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Player info */}
      <div className="mt-3 flex flex-col items-center px-4 pb-4">
        <div className="flex items-center gap-2">
          <Avatar
            name={data.playerName}
            size="sm"
            level={data.playerLevel}
            imageUrl={data.playerAvatarUrl}
          />
          <div>
            <span className="text-[16px] font-bold text-text-1">
              {data.playerName}
            </span>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2">
          {data.playerPosition && (
            <PositionBadge position={data.playerPosition} size="sm" />
          )}
          {data.teamName && (
            <span className="text-[12px] text-text-2">{data.teamName}</span>
          )}
        </div>

        {/* Score */}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[12px] text-text-3">⚡</span>
          <span
            className="font-stat text-[20px] font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            {data.totalScore}
          </span>
          <span className="text-[12px] text-text-3">점</span>
        </div>

        {/* Tier + Level */}
        <div className="mt-2 flex items-center gap-2">
          {data.mvpCount > 0 && (
            <span className="text-[11px] text-text-3">
              🏆×{data.mvpCount}
            </span>
          )}
          <LevelBadge level={data.playerLevel} size="sm" />
          {tierInfo && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: `${tierInfo.color}18`,
                border: `1px solid ${tierInfo.color}33`,
                color: tierInfo.color,
              }}
            >
              {tierInfo.icon} {tierInfo.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
