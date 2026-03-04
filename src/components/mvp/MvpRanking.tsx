"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { PositionBadge } from "@/components/ui/Badge";
import type { VoteCardCandidate } from "./VoteCard";

interface MvpRankingProps {
  candidates: VoteCardCandidate[];
  votedClipIds: Set<string>;
  votingOpen: boolean;
  votesRemaining: number;
  onVote?: (clipId: string) => void;
}

export default function MvpRanking({
  candidates,
  votedClipIds,
  votingOpen,
  votesRemaining,
  onVote,
}: MvpRankingProps) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="text-[28px]">📊</span>
        <p className="text-[13px] text-text-2">아직 후보가 없어요</p>
        <p className="text-[11px] text-text-3">
          클립을 업로드하면 자동으로 후보에 올라갑니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {candidates.map((c, idx) => {
        const isVoted = votedClipIds.has(c.clipId);
        return (
          <div
            key={c.clipId}
            className="animate-fade-up flex items-center gap-3 border-b border-card-alt px-4 py-3"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Rank */}
            <span
              className="w-6 shrink-0 text-center font-stat text-[16px] font-bold"
              style={{
                color:
                  c.rank <= 3
                    ? "var(--color-accent)"
                    : "var(--color-text-3)",
              }}
            >
              {c.rank}
            </span>

            {/* Avatar */}
            <Link href={`/p/${c.playerHandle}`} className="shrink-0">
              <Avatar
                name={c.playerName}
                size="sm"
                level={c.playerLevel}
                imageUrl={c.playerAvatarUrl}
              />
            </Link>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-bold text-text-1">
                  {c.playerName}
                </span>
                {c.playerPosition && (
                  <PositionBadge position={c.playerPosition} size="sm" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-3">
                {c.teamName && <span>{c.teamName}</span>}
                <span>🗳 {c.voteCount}</span>
              </div>
            </div>

            {/* Follow button */}
            <div className="shrink-0">
              <FollowButton targetId={c.ownerId} initialFollowing={c.isFollowing} size="sm" />
            </div>

            {/* Score */}
            <span className="shrink-0 font-stat text-[14px] font-bold text-text-1">
              {c.totalScore}
            </span>

            {/* Vote button */}
            {votingOpen && (
              <button
                onClick={() => !isVoted && votesRemaining > 0 && onVote?.(c.clipId)}
                disabled={isVoted || votesRemaining <= 0}
                className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: isVoted
                    ? "var(--color-card-alt)"
                    : "var(--accent-gradient)",
                  color: isVoted ? "var(--color-text-2)" : "#0C0C0E",
                }}
              >
                {isVoted ? "✓" : "투표"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
