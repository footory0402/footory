"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { PositionBadge } from "@/components/ui/Badge";
import type { Position } from "@/lib/constants";

export interface VoteCardCandidate {
  clipId: string;
  ownerId: string;
  rank: number;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl?: string;
  playerLevel: number;
  playerPosition: Position | null;
  teamName?: string;
  tags: string[];
  thumbnailUrl?: string;
  totalScore: number;
  viewsCount: number;
  kudosCount: number;
  voteCount: number;
}

interface VoteCardProps {
  candidate: VoteCardCandidate;
  isFirst?: boolean;
  hasVoted?: boolean;
  votingOpen?: boolean;
  votesRemaining?: number;
  onVote?: (clipId: string, message?: string) => void;
}

export default function VoteCard({
  candidate,
  isFirst = false,
  hasVoted = false,
  votingOpen = false,
  votesRemaining = 0,
  onVote,
}: VoteCardProps) {
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (hasVoted || !votingOpen || votesRemaining <= 0 || voting) return;
    setVoting(true);
    try {
      onVote?.(candidate.clipId);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      className="animate-fade-up overflow-hidden"
      style={{
        background: "#161618",
        border: isFirst
          ? "2px solid var(--color-accent)"
          : "1px solid var(--border-accent)",
        borderRadius: 12,
      }}
    >
      {/* Gold gradient top bar for 1st place */}
      {isFirst && (
        <div
          className="h-[3px] w-full"
          style={{ background: "var(--accent-gradient)" }}
        />
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-card-alt">
        {candidate.thumbnailUrl ? (
          <img
            src={candidate.thumbnailUrl}
            alt={`${candidate.playerName} 클립`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[32px] opacity-30">🎬</span>
          </div>
        )}

        {/* Rank overlay */}
        <div
          className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{
            background: isFirst
              ? "var(--accent-gradient)"
              : "rgba(0,0,0,0.7)",
            color: isFirst ? "#0C0C0E" : "#FAFAFA",
          }}
        >
          <span className="font-stat text-[13px] font-bold">
            {candidate.rank}위
          </span>
        </div>

        {/* Tags */}
        {candidate.tags.length > 0 && (
          <div className="absolute right-2 top-2">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: "rgba(212,168,83,0.15)",
                color: "var(--color-accent)",
                border: "1px solid rgba(212,168,83,0.3)",
              }}
            >
              {candidate.tags[0]}
            </span>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="space-y-2 p-3">
        {/* Player info */}
        <div className="flex items-center gap-2">
          <Avatar
            name={candidate.playerName}
            size="sm"
            level={candidate.playerLevel}
            imageUrl={candidate.playerAvatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-text-1">
                {candidate.playerName}
              </span>
              {candidate.playerPosition && (
                <PositionBadge position={candidate.playerPosition} size="sm" />
              )}
            </div>
            {candidate.teamName && (
              <p className="truncate text-[12px] text-text-2">
                {candidate.teamName}
              </p>
            )}
          </div>
        </div>

        {/* Score + Stats */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-text-3">⚡</span>
              <span className="font-stat text-[18px] font-bold text-text-1">
                {candidate.totalScore}
              </span>
              <span className="text-[11px] text-text-3">점</span>
            </div>
            <div className="mt-0.5 flex gap-2 text-[11px] text-text-3">
              <span>👁 {formatNum(candidate.viewsCount)}</span>
              <span>👏 {formatNum(candidate.kudosCount)}</span>
              <span>🗳 {candidate.voteCount}</span>
            </div>
          </div>

          {/* Vote button */}
          <button
            onClick={handleVote}
            disabled={hasVoted || !votingOpen || votesRemaining <= 0 || voting}
            className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: hasVoted
                ? "var(--color-card-alt)"
                : "var(--accent-gradient)",
              color: hasVoted ? "var(--color-text-2)" : "#0C0C0E",
            }}
          >
            {hasVoted ? "✓ 투표완료" : "투표하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact VoteCard for 2nd/3rd place
export function VoteCardCompact({
  candidate,
  hasVoted = false,
  votingOpen = false,
  votesRemaining = 0,
  onVote,
}: Omit<VoteCardProps, "isFirst">) {
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (hasVoted || !votingOpen || votesRemaining <= 0 || voting) return;
    setVoting(true);
    try {
      onVote?.(candidate.clipId);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      className="animate-fade-up flex gap-3 p-3"
      style={{
        background: "#161618",
        border: "1px solid var(--border-accent)",
        borderRadius: 12,
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-card-alt">
        {candidate.thumbnailUrl ? (
          <img
            src={candidate.thumbnailUrl}
            alt={candidate.playerName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[20px] opacity-30">
            🎬
          </div>
        )}
        <div
          className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            background: "rgba(0,0,0,0.7)",
            color: "#FAFAFA",
          }}
        >
          {candidate.rank}위
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-text-1">
            {candidate.playerName}
          </span>
          {candidate.playerPosition && (
            <PositionBadge position={candidate.playerPosition} size="sm" />
          )}
        </div>
        {candidate.teamName && (
          <p className="truncate text-[11px] text-text-2">
            {candidate.teamName}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="font-stat text-[14px] font-bold text-text-1">
            ⚡ {candidate.totalScore}점
          </span>
          <span className="text-[10px] text-text-3">
            🗳 {candidate.voteCount}
          </span>
        </div>
      </div>

      {/* Vote */}
      <button
        onClick={handleVote}
        disabled={hasVoted || !votingOpen || votesRemaining <= 0 || voting}
        className="mt-auto shrink-0 self-center rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
        style={{
          background: hasVoted
            ? "var(--color-card-alt)"
            : "var(--accent-gradient)",
          color: hasVoted ? "var(--color-text-2)" : "#0C0C0E",
        }}
      >
        {hasVoted ? "✓" : "투표"}
      </button>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
