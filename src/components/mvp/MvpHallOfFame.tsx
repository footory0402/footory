"use client";

import Avatar from "@/components/ui/Avatar";
import { PositionBadge } from "@/components/ui/Badge";
import { getMvpTierInfo } from "@/lib/mvp-scoring";
import type { Position, MvpTierKey } from "@/lib/constants";

export interface HallOfFameEntry {
  profileId: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl?: string;
  playerLevel: number;
  playerPosition: Position | null;
  teamName?: string;
  mvpCount: number;
  mvpTier: MvpTierKey | null;
}

interface MvpHallOfFameProps {
  entries: HallOfFameEntry[];
  loading?: boolean;
}

export default function MvpHallOfFame({
  entries,
  loading = false,
}: MvpHallOfFameProps) {
  if (loading) {
    return (
      <div className="space-y-3 px-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-[10px] bg-card"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="text-[28px]">🏅</span>
        <p className="text-[13px] text-text-2">아직 명예의 전당이 비어있어요</p>
        <p className="text-[11px] text-text-3">
          MVP에 선정되면 이곳에 이름이 올라갑니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => {
        const tierInfo = getMvpTierInfo(entry.mvpTier);
        const rank = idx + 1;

        return (
          <div
            key={entry.profileId}
            className="animate-fade-up flex items-center gap-3 border-b border-card-alt px-4 py-3"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Rank */}
            <span
              className={`w-6 shrink-0 text-center font-stat text-[16px] font-bold ${
                rank === 1 ? "text-accent" : rank <= 3 ? "text-text-1" : "text-text-3"
              }`}
            >
              {rank}
            </span>

            {/* Avatar */}
            <Avatar
              name={entry.playerName}
              size="sm"
              level={entry.playerLevel}
              imageUrl={entry.playerAvatarUrl}
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-bold text-text-1">
                  {entry.playerName}
                </span>
                {entry.playerPosition && (
                  <PositionBadge position={entry.playerPosition} size="sm" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-3">
                {entry.teamName && <span className="text-text-2">{entry.teamName}</span>}
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

            {/* MVP count */}
            <div className="shrink-0 text-right">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[12px]">🏆</span>
                <span
                  className="font-stat text-[16px] font-bold"
                  style={{ color: "var(--color-accent)" }}
                >
                  {entry.mvpCount}
                </span>
              </div>
              <p className="text-[9px] text-text-3">회 선정</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
