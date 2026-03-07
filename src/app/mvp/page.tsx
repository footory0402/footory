"use client";

import { useEffect, useState, useCallback } from "react";
import { SectionCard } from "@/components/ui/Card";
import VoteCard, {
  VoteCardCompact,
  type VoteCardCandidate,
} from "@/components/mvp/VoteCard";
import MvpRanking from "@/components/mvp/MvpRanking";
import dynamic from "next/dynamic";
import type { ArchiveWeek } from "@/components/mvp/MvpArchive";
import type { HallOfFameEntry } from "@/components/mvp/MvpHallOfFame";

const MvpArchive = dynamic(() => import("@/components/mvp/MvpArchive"), { ssr: false });
const MvpHallOfFame = dynamic(() => import("@/components/mvp/MvpHallOfFame"), { ssr: false });
import {
  isVotingOpen,
  getVotingTimeRemaining,
  formatWeekRange,
} from "@/lib/mvp-scoring";
import { MAX_WEEKLY_VOTES } from "@/lib/constants";
import { usePermissions } from "@/hooks/usePermissions";

type MvpTab = "ranking" | "archive" | "hallOfFame";

export default function MvpPage() {
  const { canVoteMvp } = usePermissions();
  const [candidates, setCandidates] = useState<VoteCardCandidate[]>([]);
  const [myVotedClipIds, setMyVotedClipIds] = useState<Set<string>>(new Set());
  const [votesRemaining, setVotesRemaining] = useState(MAX_WEEKLY_VOTES);
  const [votingOpen, setVotingOpen] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weeklyStats, setWeeklyStats] = useState({
    clipCount: 0,
    totalVotes: 0,
    newPlayers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<MvpTab>("ranking");
  const [showFullRanking, setShowFullRanking] = useState(false);

  // Archive & Hall of Fame
  const [archiveWeeks, setArchiveWeeks] = useState<ArchiveWeek[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [hofLoading, setHofLoading] = useState(false);

  // Fetch candidates
  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("/api/mvp/candidates");
      if (!res.ok) return;
      const data = await res.json();
      setCandidates(data.candidates ?? []);
      setMyVotedClipIds(new Set(data.myVotes ?? []));
      setVotesRemaining(data.votesRemaining ?? MAX_WEEKLY_VOTES);
      setVotingOpen(data.votingOpen ?? false);
      setWeekStart(data.weekStart ?? "");
      setWeeklyStats(
        data.weeklyStats ?? { clipCount: 0, totalVotes: 0, newPlayers: 0 }
      );
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch archive
  const fetchArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch("/api/mvp/archive?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setArchiveWeeks(data.weeks ?? []);
    } catch {
      // Silent fail
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  // Fetch hall of fame
  const fetchHallOfFame = useCallback(async () => {
    setHofLoading(true);
    try {
      const res = await fetch("/api/mvp/hall-of-fame?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setHallOfFame(data.entries ?? []);
    } catch {
      // Silent fail
    } finally {
      setHofLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Load sub-tab data on tab change
  useEffect(() => {
    if (activeTab === "archive" && archiveWeeks.length === 0) {
      fetchArchive();
    } else if (activeTab === "hallOfFame" && hallOfFame.length === 0) {
      fetchHallOfFame();
    }
  }, [activeTab, archiveWeeks.length, hallOfFame.length, fetchArchive, fetchHallOfFame]);

  // Check voting open status (not every second — just on mount and candidates fetch)
  useEffect(() => {
    setVotingOpen(isVotingOpen());
  }, [candidates]);

  // Handle vote (optimistic update)
  const handleVote = async (clipId: string) => {
    // Optimistic update
    setMyVotedClipIds((prev) => new Set([...prev, clipId]));
    setVotesRemaining((prev) => prev - 1);

    try {
      const res = await fetch("/api/mvp/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });

      if (!res.ok) {
        // Revert
        setMyVotedClipIds((prev) => {
          const next = new Set(prev);
          next.delete(clipId);
          return next;
        });
        setVotesRemaining((prev) => prev + 1);
        const err = await res.json();
        alert(err.error ?? "투표에 실패했습니다");
        return;
      }

      const data = await res.json();
      setVotesRemaining(data.votesRemaining);
      setCandidates((prev) =>
        prev.map((c) =>
          c.clipId === clipId ? { ...c, voteCount: c.voteCount + 1 } : c
        )
      );
    } catch {
      // Revert
      setMyVotedClipIds((prev) => {
        const next = new Set(prev);
        next.delete(clipId);
        return next;
      });
      setVotesRemaining((prev) => prev + 1);
      alert("네트워크 오류가 발생했습니다");
    }
  };

  // Handle unvote (optimistic update)
  const handleUnvote = async (clipId: string) => {
    // Optimistic update
    setMyVotedClipIds((prev) => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
    setVotesRemaining((prev) => prev + 1);

    try {
      const res = await fetch("/api/mvp/vote", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });

      if (!res.ok) {
        // Revert
        setMyVotedClipIds((prev) => new Set([...prev, clipId]));
        setVotesRemaining((prev) => prev - 1);
        const err = await res.json();
        alert(err.error ?? "투표 취소에 실패했습니다");
        return;
      }

      const data = await res.json();
      setVotesRemaining(data.votesRemaining);
      setCandidates((prev) =>
        prev.map((c) =>
          c.clipId === clipId ? { ...c, voteCount: c.voteCount - 1 } : c
        )
      );
    } catch {
      // Revert
      setMyVotedClipIds((prev) => new Set([...prev, clipId]));
      setVotesRemaining((prev) => prev - 1);
      alert("네트워크 오류가 발생했습니다");
    }
  };

  const top3 = candidates.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-card" />
        <div className="h-64 animate-pulse rounded-[14px] bg-card" />
        <div className="h-20 animate-pulse rounded-[10px] bg-card" />
        <div className="h-20 animate-pulse rounded-[10px] bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-text-1">
            🏆 주간 MVP
          </h1>
          {weekStart && (
            <p className="mt-0.5 text-[12px] text-text-3">
              {formatWeekRange(weekStart)} 주차
            </p>
          )}
        </div>

        {/* Voting status */}
        <VotingStatusBadge votingOpen={votingOpen} />
      </div>

      {/* My vote status */}
      {votingOpen && (
        <div
          className="flex items-center justify-between rounded-[10px] px-4 py-3"
          style={{
            background: "var(--accent-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <span className="text-[13px] font-bold text-text-1">
            🗳 내 투표
          </span>
          <div className="flex items-center gap-2">
            {/* Vote dots */}
            <div className="flex gap-1">
              {Array.from({ length: MAX_WEEKLY_VOTES }).map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      i < MAX_WEEKLY_VOTES - votesRemaining
                        ? "var(--color-accent)"
                        : "var(--color-card-alt)",
                    border:
                      i < MAX_WEEKLY_VOTES - votesRemaining
                        ? "none"
                        : "1px solid var(--color-border)",
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] text-text-2">
              {MAX_WEEKLY_VOTES - votesRemaining}/{MAX_WEEKLY_VOTES} 사용
            </span>
          </div>
        </div>
      )}

      {/* Top candidates or empty state */}
      {candidates.length === 0 ? (
        <SectionCard title="이번 주 MVP" icon="🏆">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-[32px]">🏆</span>
            <p className="text-[13px] text-text-2">
              아직 이번 주 후보가 없어요
            </p>
            <p className="text-[11px] text-text-3">
              클립을 업로드하면 자동으로 MVP 후보에 올라갑니다
            </p>
          </div>
        </SectionCard>
      ) : (
        <>
          {/* B8: 선수만 투표 가능 — role != 'player'이면 투표 버튼 비활성 */}
          {!canVoteMvp && votingOpen && (
            <p className="rounded-[10px] bg-card-alt px-4 py-2 text-center text-[12px] text-text-3">
              MVP 투표는 선수 계정만 참여할 수 있어요
            </p>
          )}

          {/* 1st place — large card */}
          {first && (
            <VoteCard
              candidate={first}
              isFirst
              hasVoted={myVotedClipIds.has(first.clipId)}
              votingOpen={canVoteMvp && votingOpen}
              votesRemaining={canVoteMvp ? votesRemaining : 0}
              onVote={handleVote}
              onUnvote={handleUnvote}
            />
          )}

          {/* 2nd & 3rd — compact cards side by side */}
          {(second || third) && (
            <div className="grid grid-cols-2 gap-2">
              {second && (
                <VoteCardCompact
                  candidate={second}
                  hasVoted={myVotedClipIds.has(second.clipId)}
                  votingOpen={canVoteMvp && votingOpen}
                  votesRemaining={canVoteMvp ? votesRemaining : 0}
                  onVote={handleVote}
                  onUnvote={handleUnvote}
                />
              )}
              {third && (
                <VoteCardCompact
                  candidate={third}
                  hasVoted={myVotedClipIds.has(third.clipId)}
                  votingOpen={canVoteMvp && votingOpen}
                  votesRemaining={canVoteMvp ? votesRemaining : 0}
                  onVote={handleVote}
                  onUnvote={handleUnvote}
                />
              )}
            </div>
          )}

          {/* Full ranking toggle */}
          {candidates.length > 3 && (
            <button
              onClick={() => setShowFullRanking(!showFullRanking)}
              className="w-full rounded-[10px] border border-border bg-card px-4 py-2.5 text-center text-[13px] font-bold text-text-2 transition-colors hover:text-accent"
            >
              {showFullRanking ? "접기" : `전체 순위 보기 (${candidates.length}명)`}
            </button>
          )}

          {showFullRanking && (
            <div className="overflow-hidden rounded-[10px] border border-border bg-card">
              <MvpRanking
                candidates={candidates}
                votedClipIds={myVotedClipIds}
                votingOpen={canVoteMvp && votingOpen}
                votesRemaining={canVoteMvp ? votesRemaining : 0}
                onVote={handleVote}
                onUnvote={handleUnvote}
              />
            </div>
          )}
        </>
      )}

      {/* Weekly stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="이번 주 클립" value={weeklyStats.clipCount} icon="🎬" />
        <StatBox label="총 투표" value={weeklyStats.totalVotes} icon="🗳" />
        <StatBox label="신규 선수" value={weeklyStats.newPlayers} icon="👤" />
      </div>

      {/* Sub-tabs: Archive / Hall of Fame */}
      <div className="flex gap-1 rounded-[10px] bg-card p-1">
        {(
          [
            { key: "ranking", label: "📊 이번 주" },
            { key: "archive", label: "📜 아카이브" },
            { key: "hallOfFame", label: "🏅 명예의 전당" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-lg px-2 py-2 text-[12px] font-bold transition-colors"
            style={{
              background:
                activeTab === tab.key
                  ? "var(--accent-bg)"
                  : "transparent",
              color:
                activeTab === tab.key
                  ? "var(--color-accent)"
                  : "var(--color-text-3)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "ranking" && candidates.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-border bg-card">
          <MvpRanking
            candidates={candidates}
            votedClipIds={myVotedClipIds}
            votingOpen={canVoteMvp && votingOpen}
            votesRemaining={canVoteMvp ? votesRemaining : 0}
            onVote={handleVote}
            onUnvote={handleUnvote}
          />
        </div>
      )}

      {activeTab === "archive" && (
        <MvpArchive weeks={archiveWeeks} loading={archiveLoading} />
      )}

      {activeTab === "hallOfFame" && (
        <div className="overflow-hidden rounded-[10px] border border-border bg-card">
          <MvpHallOfFame entries={hallOfFame} loading={hofLoading} />
        </div>
      )}
    </div>
  );
}

// ── Stat Box ─────────────────────────────────────────────

// Isolated timer component — only this re-renders every second
function VotingStatusBadge({ votingOpen }: { votingOpen: boolean }) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!votingOpen) {
      setTimeRemaining(null);
      return;
    }
    const update = () => setTimeRemaining(getVotingTimeRemaining());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [votingOpen]);

  return (
    <div className="text-right">
      {votingOpen ? (
        <div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{
              background: "rgba(74,222,128,0.12)",
              color: "var(--color-green)",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            투표 진행중
          </span>
          {timeRemaining && (
            <p className="mt-0.5 font-stat text-[11px] text-text-3">
              {String(timeRemaining.hours).padStart(2, "0")}:
              {String(timeRemaining.minutes).padStart(2, "0")}:
              {String(timeRemaining.seconds).padStart(2, "0")} 남음
            </p>
          )}
        </div>
      ) : (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{
            background: "rgba(113,113,122,0.12)",
            color: "var(--color-text-3)",
            border: "1px solid rgba(113,113,122,0.3)",
          }}
        >
          집계중
        </span>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[10px] border border-border bg-card px-3 py-3">
      <span className="text-[14px]">{icon}</span>
      <span className="font-stat text-[18px] font-bold text-text-1">
        {value}
      </span>
      <span className="text-[10px] text-text-3">{label}</span>
    </div>
  );
}
