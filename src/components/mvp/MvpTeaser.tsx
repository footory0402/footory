"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getVotingTimeRemaining, isVotingOpen } from "@/lib/mvp-scoring";
import type { MvpLeaderData } from "@/lib/server/feed";

interface MvpTeaserProps {
  leader: MvpLeaderData | null;
}

export default function MvpTeaser({ leader }: MvpTeaserProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [votingOpen, setVotingOpen] = useState(false);

  // Only client-side work: live countdown timer
  useEffect(() => {
    const update = () => {
      setVotingOpen(isVotingOpen());
      setTimeLeft(getVotingTimeRemaining());
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!leader) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Link href="/mvp" className="mb-4 block">
      <div
        className="overflow-hidden rounded-[12px] transition-opacity active:opacity-80"
        style={{
          background: "var(--color-card)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
        }}
      >
        {/* Gold accent line */}
        <div className="h-[2px]" style={{ background: "var(--accent-gradient)" }} />

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Thumbnail */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-card-alt">
            {leader.thumbnailUrl ? (
              <Image
                src={leader.thumbnailUrl}
                alt={leader.playerName}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[18px] opacity-25">
                🎬
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--color-bg) 55%, transparent)" }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--color-accent)" }}
              >
                🏆 주간 MVP 1위
              </span>
              <div className="h-2.5 w-px bg-border" />
              {votingOpen && timeLeft ? (
                <span className="font-stat text-[10px] text-text-3">
                  ⏱ {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </span>
              ) : (
                <span className="text-[10px] text-text-3">⏸ 집계중</span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate text-[13px] font-bold text-text-1">
                {leader.playerName}
              </span>
              {leader.tags[0] && (
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}
                >
                  {leader.tags[0]}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-3">
              {leader.teamName && <span className="truncate">{leader.teamName}</span>}
              <span>🗳 <span className="font-stat font-bold text-text-2">{leader.voteCount}</span>표</span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="shrink-0 flex items-center gap-1 rounded-[8px] px-3 py-2 text-[11px] font-bold"
            style={{ background: "var(--accent-gradient)", color: "var(--color-bg)" }}
          >
            투표
            <svg
              width="10" height="10" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
