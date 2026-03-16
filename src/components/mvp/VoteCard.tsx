"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { PositionBadge } from "@/components/ui/Badge";
import LazyVideo, { requestVideoPlay } from "@/components/ui/LazyVideo";
import type { Position } from "@/lib/constants";
import MvpThumbnail from "./MvpThumbnail";

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
    requestVideoPlay(videoRef);
  };

  return (
    <div
      className={`animate-fade-up overflow-hidden transition-transform duration-100 active:scale-[0.98] ${isFirst ? "card-accent" : ""}`}
      style={{
        background: "#161618",
        border: isFirst
          ? "2px solid var(--color-accent)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        boxShadow: isFirst
          ? "0 0 24px rgba(212,168,83,0.18), 0 4px 16px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Gold gradient top bar for 1st place */}
      {isFirst && (
        <>
          <div
            className="h-[3px] w-full"
            style={{ background: "var(--accent-gradient)" }}
          />
          <div className="card-accent-line" />
        </>
      )}

      {/* Video / Thumbnail — 5:2 ratio */}
      <div className="relative aspect-[5/2] w-full overflow-hidden bg-black/30">
        {playing && candidate.videoUrl ? (
          <LazyVideo
            videoRef={videoRef}
            src={candidate.videoUrl}
            poster={candidate.thumbnailUrl}
            className="h-full w-full object-cover"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            {candidate.thumbnailUrl ? (
              <MvpThumbnail
                src={candidate.thumbnailUrl}
                alt={`${candidate.playerName} 클립`}
                sizes="(max-width: 430px) 100vw, 430px"
                priority={isFirst}
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
      <div className={`flex items-center gap-2 px-3.5 sm:gap-2.5 sm:px-4 ${isFirst ? "py-3 sm:py-4" : "py-2.5 sm:py-3"}`}>
        <Link
          href={`/p/${candidate.playerHandle}`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label={`${candidate.playerName} 프로필 보기`}
        >
          <Avatar
            name={candidate.playerName}
            size="sm"
            imageUrl={candidate.playerAvatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold text-text-1" style={{ letterSpacing: "-0.3px" }}>
                {candidate.playerName}
              </span>
              {candidate.playerPosition && (
                <PositionBadge position={candidate.playerPosition} size="sm" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-3">
              {candidate.teamName && <span className="truncate font-medium text-accent">{candidate.teamName}</span>}
              <span className="text-text-3/50">⚡</span><span className="font-stat font-bold text-accent">{candidate.totalScore}</span>
              <span className="text-text-3/50">🗳</span> <span className="font-semibold text-accent">{candidate.voteCount}</span>
            </div>
          </div>
        </Link>

        {/* Vote button */}
        <button
          onClick={hasVoted ? handleUnvote : handleVote}
          disabled={(!hasVoted && (!votingOpen || votesRemaining <= 0)) || (hasVoted && !votingOpen)}
          className="shrink-0 rounded-lg px-4 text-[13px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            height: 34,
            background: hasVoted ? "rgba(212,168,83,0.1)" : "var(--accent-gradient)",
            color: hasVoted ? "var(--color-accent)" : "#0C0C0E",
            border: hasVoted ? "1px solid rgba(212,168,83,0.2)" : "none",
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
    requestVideoPlay(videoRef);
  };

  return (
    <div
      className="animate-fade-up flex flex-col overflow-hidden transition-transform duration-100 active:scale-[0.98]"
      style={{
        background: "#161618",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Thumbnail / Video */}
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-black/30 sm:aspect-video">
        {playing && candidate.videoUrl ? (
          <LazyVideo
            videoRef={videoRef}
            src={candidate.videoUrl}
            poster={candidate.thumbnailUrl}
            className="h-full w-full object-cover"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            {candidate.thumbnailUrl ? (
              <MvpThumbnail
                src={candidate.thumbnailUrl}
                alt={candidate.playerName}
                sizes="(max-width: 430px) 50vw, 215px"
                fallbackClassName="text-[20px]"
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
      <div className="flex flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <Link
          href={`/p/${candidate.playerHandle}`}
          className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label={`${candidate.playerName} 프로필 보기`}
        >
          <div className="min-w-0 w-full">
            <span className="block max-w-full truncate text-[14px] font-bold text-text-1 sm:text-[15px]" style={{ letterSpacing: "-0.3px" }}>
              {candidate.playerName}
            </span>
            {candidate.teamName && (
              <p className="truncate text-[10px] font-medium text-accent sm:text-[11px]">
                {candidate.teamName}
              </p>
            )}
            <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1">
              <span className="text-text-3/50">⚡</span> <span className="font-stat text-xs font-bold text-accent">{candidate.totalScore}</span>
              <span className="text-[10px] text-text-3">
                <span className="text-text-3/50">🗳</span> <span className="font-semibold text-accent">{candidate.voteCount}</span>
              </span>
            </div>
          </div>
        </Link>

        <button
          onClick={hasVoted ? handleUnvote : handleVote}
          disabled={(!hasVoted && (!votingOpen || votesRemaining <= 0)) || (hasVoted && !votingOpen)}
          className="w-full rounded-lg py-1.5 text-[12px] font-bold transition-all active:scale-[0.97] disabled:opacity-40 sm:py-2 sm:text-[13px]"
          style={{
            background: hasVoted ? "rgba(212,168,83,0.1)" : "var(--accent-gradient)",
            color: hasVoted ? "var(--color-accent)" : "#0C0C0E",
            border: hasVoted ? "1px solid rgba(212,168,83,0.2)" : "none",
          }}
        >
          {hasVoted ? "✓ 취소" : "투표"}
        </button>
      </div>
    </div>
  );
}
