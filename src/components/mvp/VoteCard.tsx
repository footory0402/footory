"use client";

import { useState, useRef } from "react";
import Image from "next/image";
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
  videoUrl?: string;
  thumbnailUrl?: string;
  totalScore: number;
  viewsCount: number;
  kudosCount: number;
  voteCount: number;
  isFollowing?: boolean;
}

interface VoteCardProps {
  candidate: VoteCardCandidate;
  isFirst?: boolean;
  hasVoted?: boolean;
  votingOpen?: boolean;
  votesRemaining?: number;
  onVote?: (clipId: string, message?: string) => void;
  onUnvote?: (clipId: string) => void;
}

export default function VoteCard({
  candidate,
  isFirst = false,
  hasVoted = false,
  votingOpen = false,
  votesRemaining = 0,
  onVote,
  onUnvote,
}: VoteCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVote = () => {
    if (hasVoted || !votingOpen || votesRemaining <= 0) return;
    onVote?.(candidate.clipId);
  };

  const handleUnvote = () => {
    if (!hasVoted || !votingOpen) return;
    onUnvote?.(candidate.clipId);
  };

  const handlePlay = () => {
    if (!candidate.videoUrl) return;
    setPlaying(true);
    // Auto play after render
    setTimeout(() => videoRef.current?.play(), 50);
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

      {/* Video / Thumbnail — 5:2 ratio */}
      <div className="relative aspect-[5/2] w-full overflow-hidden bg-black/30">
        {playing && candidate.videoUrl ? (
          <video
            ref={videoRef}
            src={candidate.videoUrl}
            controls
            playsInline
            className="h-full w-full object-cover"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            {candidate.thumbnailUrl ? (
              <Image
                src={candidate.thumbnailUrl}
                alt={`${candidate.playerName} 클립`}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-[28px] opacity-30">🎬</span>
              </div>
            )}

            {/* Rank overlay */}
            <div
              className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: isFirst ? "var(--accent-gradient)" : "rgba(0,0,0,0.7)",
                color: isFirst ? "#0C0C0E" : "#FAFAFA",
              }}
            >
              <span className="font-stat text-[12px] font-bold">
                {candidate.rank}위
              </span>
            </div>

            {/* Tag */}
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

            {/* Play button */}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Info section — compact single row */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Avatar
          name={candidate.playerName}
          size="sm"
          level={candidate.playerLevel}
          imageUrl={candidate.playerAvatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-text-1">
              {candidate.playerName}
            </span>
            {candidate.playerPosition && (
              <PositionBadge position={candidate.playerPosition} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-3">
            {candidate.teamName && <span className="truncate text-text-2">{candidate.teamName}</span>}
            <span>⚡<span className="font-stat font-bold text-text-1">{candidate.totalScore}</span></span>
            <span>🗳 <span className="text-text-1 font-medium">{candidate.voteCount}</span></span>
          </div>
        </div>

        {/* Vote button */}
        <button
          onClick={hasVoted ? handleUnvote : handleVote}
          disabled={(!hasVoted && (!votingOpen || votesRemaining <= 0)) || (hasVoted && !votingOpen)}
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            background: hasVoted ? "rgba(113,113,122,0.2)" : "var(--accent-gradient)",
            color: hasVoted ? "var(--color-text-2)" : "#0C0C0E",
            border: hasVoted ? "1px solid rgba(113,113,122,0.3)" : "none",
          }}
        >
          {hasVoted ? "✓ 취소" : "투표"}
        </button>
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
  onUnvote,
}: Omit<VoteCardProps, "isFirst">) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVote = () => {
    if (hasVoted || !votingOpen || votesRemaining <= 0) return;
    onVote?.(candidate.clipId);
  };

  const handleUnvote = () => {
    if (!hasVoted || !votingOpen) return;
    onUnvote?.(candidate.clipId);
  };

  const handlePlay = () => {
    if (!candidate.videoUrl) return;
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 50);
  };

  return (
    <div
      className="animate-fade-up flex flex-col overflow-hidden"
      style={{
        background: "#161618",
        border: "1px solid var(--border-accent)",
        borderRadius: 12,
      }}
    >
      {/* Thumbnail / Video */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/30">
        {playing && candidate.videoUrl ? (
          <video
            ref={videoRef}
            src={candidate.videoUrl}
            controls
            playsInline
            className="h-full w-full object-cover"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            {candidate.thumbnailUrl ? (
              <Image
                src={candidate.thumbnailUrl}
                alt={candidate.playerName}
                fill
                sizes="(max-width: 430px) 50vw, 215px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[20px] opacity-30">
                🎬
              </div>
            )}
            <div
              className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: "rgba(0,0,0,0.75)",
                color: "#FAFAFA",
              }}
            >
              {candidate.rank}위
            </div>
            {/* Play button */}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Info + Vote */}
      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0 w-full">
          <span className="block truncate text-[15px] font-bold text-text-1 max-w-full">
            {candidate.playerName}
          </span>
          {candidate.teamName && (
            <p className="truncate text-[10px] text-text-2">
              {candidate.teamName}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-stat text-xs font-bold text-text-1">
              ⚡ {candidate.totalScore}
            </span>
            <span className="text-[10px] text-text-3">
              🗳 <span className="text-text-1 font-medium">{candidate.voteCount}</span>
            </span>
          </div>
        </div>

        <button
          onClick={hasVoted ? handleUnvote : handleVote}
          disabled={(!hasVoted && (!votingOpen || votesRemaining <= 0)) || (hasVoted && !votingOpen)}
          className="w-full rounded-lg py-1.5 text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            background: hasVoted ? "rgba(113,113,122,0.2)" : "var(--accent-gradient)",
            color: hasVoted ? "var(--color-text-2)" : "#0C0C0E",
            border: hasVoted ? "1px solid rgba(113,113,122,0.3)" : "none",
          }}
        >
          {hasVoted ? "✓ 취소" : "투표"}
        </button>
      </div>
    </div>
  );
}
