"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { PositionBadge } from "@/components/ui/Badge";
import type { VoteCardCandidate } from "./VoteCard";

interface MvpRankingProps {
  candidates: VoteCardCandidate[];
  votedClipIds: Set<string>;
  votingOpen: boolean;
  votesRemaining: number;
  onVote?: (clipId: string) => void;
  onUnvote?: (clipId: string) => void;
}

export default function MvpRanking({
  candidates,
  votedClipIds,
  votingOpen,
  votesRemaining,
  onVote,
  onUnvote,
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
      {candidates.map((c, idx) => (
        <RankingRow
          key={c.clipId}
          candidate={c}
          isVoted={votedClipIds.has(c.clipId)}
          votingOpen={votingOpen}
          votesRemaining={votesRemaining}
          onVote={onVote}
          onUnvote={onUnvote}
          delay={idx * 0.05}
        />
      ))}
    </div>
  );
}

function RankingRow({
  candidate: c,
  isVoted,
  votingOpen,
  votesRemaining,
  onVote,
  onUnvote,
  delay,
}: {
  candidate: VoteCardCandidate;
  isVoted: boolean;
  votingOpen: boolean;
  votesRemaining: number;
  onVote?: (clipId: string) => void;
  onUnvote?: (clipId: string) => void;
  delay: number;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (!c.videoUrl) return;
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 50);
  };

  return (
    <div
      className="animate-fade-up border-b border-card-alt"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Rank */}
        <span
          className="w-6 shrink-0 text-center font-stat text-base font-bold"
          style={{
            color:
              c.rank <= 3
                ? "var(--color-accent)"
                : "var(--color-text-3)",
          }}
        >
          {c.rank}
        </span>

        {/* Thumbnail — small, clickable */}
        <button
          onClick={handlePlay}
          className="relative shrink-0 overflow-hidden rounded-xl bg-black/30"
          style={{ width: 56, height: 42 }}
        >
          {c.thumbnailUrl ? (
            <Image
              src={c.thumbnailUrl}
              alt={c.playerName}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[14px] opacity-30">
              🎬
            </div>
          )}
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>

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
            <span className="truncate text-sm font-semibold text-text-1">
              {c.playerName}
            </span>
            {c.playerPosition && (
              <PositionBadge position={c.playerPosition} size="sm" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-text-3">
            {c.teamName && <span>{c.teamName}</span>}
            <span>⚡ {c.totalScore}</span>
            <span>🗳 {c.voteCount}</span>
          </div>
        </div>

        {/* Vote button */}
        {votingOpen && (
          <button
            onClick={() => isVoted ? onUnvote?.(c.clipId) : (votesRemaining > 0 && onVote?.(c.clipId))}
            disabled={(!isVoted && votesRemaining <= 0)}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: isVoted ? "rgba(113,113,122,0.2)" : "var(--accent-gradient)",
              color: isVoted ? "var(--color-text-2)" : "#0C0C0E",
              border: isVoted ? "1px solid rgba(113,113,122,0.3)" : "none",
            }}
          >
            {isVoted ? "✓ 취소" : "투표"}
          </button>
        )}
      </div>

      {/* Inline video player — expands below the row */}
      {playing && c.videoUrl && (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            src={c.videoUrl}
            controls
            playsInline
            className="w-full"
            style={{ maxHeight: 220 }}
            onEnded={() => setPlaying(false)}
          />
          <button
            onClick={() => {
              videoRef.current?.pause();
              setPlaying(false);
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[12px] text-white"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
