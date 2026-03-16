"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/ui/Card";
import VoteCard, {
  VoteCardCompact,
  type VoteCardCandidate,
} from "@/components/mvp/VoteCard";
import MvpRanking from "@/components/mvp/MvpRanking";
import {
  canVoteMvp as canVoteMvpForRole,
  type UserRole,
} from "@/lib/permissions";
import { MAX_MONTHLY_VOTES } from "@/lib/constants";
import {
  formatMonthRange,
  getVotingTimeRemaining,
} from "@/lib/mvp-scoring";
import type { ArchiveWeek } from "@/components/mvp/MvpArchive";
import type { HallOfFameEntry } from "@/components/mvp/MvpHallOfFame";
import type { MvpCandidatesPayload } from "@/lib/server/mvp";

const MvpArchive = dynamic(() => import("@/components/mvp/MvpArchive"), {
  ssr: false,
});
const MvpHallOfFame = dynamic(() => import("@/components/mvp/MvpHallOfFame"), {
  ssr: false,
});

type MvpTab = "ranking" | "archive" | "hallOfFame";

interface MvpPageClientProps {
  initialData: MvpCandidatesPayload;
  viewerRole: UserRole;
}

export default function MvpPageClient({
  initialData,
  viewerRole,
}: MvpPageClientProps) {
  const canVoteMvp = canVoteMvpForRole(viewerRole);
  const [candidates, setCandidates] = useState<VoteCardCandidate[]>(
    initialData.candidates
  );
  const [myVotedClipIds, setMyVotedClipIds] = useState<Set<string>>(
    () => new Set(initialData.myVotes)
  );
  const [votesRemaining, setVotesRemaining] = useState(initialData.votesRemaining);
  const [votingOpen, setVotingOpen] = useState(initialData.votingOpen);
  const [activeTab, setActiveTab] = useState<MvpTab>("ranking");
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [archiveWeeks, setArchiveWeeks] = useState<ArchiveWeek[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [hofLoading, setHofLoading] = useState(false);
  const [, startTransition] = useTransition();

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

  useEffect(() => {
    if (activeTab === "archive" && archiveWeeks.length === 0) {
      void fetchArchive();
    } else if (activeTab === "hallOfFame" && hallOfFame.length === 0) {
      void fetchHallOfFame();
    }
  }, [
    activeTab,
    archiveWeeks.length,
    hallOfFame.length,
    fetchArchive,
    fetchHallOfFame,
  ]);

  const handleVote = async (clipId: string) => {
    setMyVotedClipIds((prev) => new Set([...prev, clipId]));
    setVotesRemaining((prev) => prev - 1);

    try {
      const res = await fetch("/api/mvp/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });

      if (!res.ok) {
        setMyVotedClipIds((prev) => {
          const next = new Set(prev);
          next.delete(clipId);
          return next;
        });
        setVotesRemaining((prev) => prev + 1);
        const err = await res.json();
        toast.error(err.error ?? "투표에 실패했습니다");
        return;
      }

      const data = await res.json();
      setVotesRemaining(data.votesRemaining);
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.clipId === clipId
            ? { ...candidate, voteCount: candidate.voteCount + 1 }
            : candidate
        )
      );
      setVotingOpen(data.votingOpen ?? initialData.votingOpen);
    } catch {
      setMyVotedClipIds((prev) => {
        const next = new Set(prev);
        next.delete(clipId);
        return next;
      });
      setVotesRemaining((prev) => prev + 1);
      toast.error("네트워크 오류가 발생했습니다");
    }
  };

  const handleUnvote = async (clipId: string) => {
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
        setMyVotedClipIds((prev) => new Set([...prev, clipId]));
        setVotesRemaining((prev) => prev - 1);
        const err = await res.json();
        toast.error(err.error ?? "투표 취소에 실패했습니다");
        return;
      }

      const data = await res.json();
      setVotesRemaining(data.votesRemaining);
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.clipId === clipId
            ? { ...candidate, voteCount: candidate.voteCount - 1 }
            : candidate
        )
      );
      setVotingOpen(data.votingOpen ?? initialData.votingOpen);
    } catch {
      setMyVotedClipIds((prev) => new Set([...prev, clipId]));
      setVotesRemaining((prev) => prev - 1);
      toast.error("네트워크 오류가 발생했습니다");
    }
  };

  const top3 = candidates.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="space-y-4 px-4 py-3 pb-[calc(88px+env(safe-area-inset-bottom))] sm:space-y-6 sm:py-4 sm:pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-1">🏆 월간 MVP</h1>
          {initialData.monthStart && (
            <p className="mt-0.5 text-[12px] text-text-3">
              {formatMonthRange(initialData.monthStart)}
            </p>
          )}
        </div>

        <VotingStatusBadge votingOpen={votingOpen} />
      </div>

      {votingOpen && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: "var(--accent-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <span className="text-sm font-semibold text-text-1">🗳 내 투표</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: MAX_MONTHLY_VOTES }).map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      i < MAX_MONTHLY_VOTES - votesRemaining
                        ? "var(--color-accent)"
                        : "var(--color-card-alt)",
                    border:
                      i < MAX_MONTHLY_VOTES - votesRemaining
                        ? "none"
                        : "1px solid var(--color-border)",
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] text-text-2">
              {MAX_MONTHLY_VOTES - votesRemaining}/{MAX_MONTHLY_VOTES} 사용
            </span>
          </div>
        </div>
      )}

      {votingOpen && canVoteMvp && votesRemaining === 0 && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: "rgba(212,168,83,0.08)",
            border: "1px solid rgba(212,168,83,0.25)",
          }}
        >
          <span className="text-[16px]">🎉</span>
          <div>
            <p className="text-sm font-semibold text-accent">
              이번 달 투표를 모두 사용했어요!
            </p>
            <p className="text-xs text-text-3">
              투표한 클립에 다시 투표하면 취소할 수 있어요
            </p>
          </div>
        </div>
      )}

      {candidates.length === 0 ? (
        <SectionCard title="이번 달 MVP" icon="🏆">
          {viewerRole === "scout" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">🏆</span>
              <p className="text-sm font-semibold text-text-1">MVP 투표 준비 중</p>
              <p className="text-xs text-text-3">
                선수 탐색에서 유망주를 먼저 확인해보세요
              </p>
              <Link
                href="/discover"
                className="mt-1 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg"
              >
                선수 탐색하기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">🏆</span>
              <p className="text-xs text-text-2">아직 이번 달 후보가 없어요</p>
              <p className="text-[10px] text-text-3">
                클립을 업로드하면 자동으로 MVP 후보에 올라갑니다
              </p>
              <Link
                href="/upload"
                className="mt-1 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg"
              >
                첫 번째 클립을 올려보세요!
              </Link>
            </div>
          )}
        </SectionCard>
      ) : (
        <>
          {!canVoteMvp && votingOpen && (
            <div className="rounded-xl bg-card-alt px-4 py-3 text-center">
              <p className="text-xs text-text-3">
                MVP 투표는 선수 계정만 참여할 수 있어요
              </p>
              <p className="mt-0.5 text-[10px] text-text-3 opacity-70">
                스카우터·학부모는 순위 확인만 가능합니다
              </p>
            </div>
          )}

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

          {(second || third) && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
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

          {candidates.length > 3 && (
            <button
              onClick={() =>
                startTransition(() => setShowFullRanking((prev) => !prev))
              }
              className="w-full card-elevated px-4 py-2.5 text-center text-[13px] font-bold text-text-2 transition-colors hover:text-accent"
            >
              {showFullRanking ? "접기" : `전체 순위 보기 (${candidates.length}명)`}
            </button>
          )}

          {showFullRanking && (
            <div className="card-elevated overflow-hidden">
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

      <div className="flex gap-1 card-elevated p-1">
        {(
          [
            { key: "ranking", label: "📊 이번 달" },
            { key: "archive", label: "📜 아카이브" },
            { key: "hallOfFame", label: "🏅 명예의 전당" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => startTransition(() => setActiveTab(tab.key))}
            className="flex-1 rounded-lg px-2 py-2 text-[12px] font-bold transition-colors"
            style={{
              background:
                activeTab === tab.key ? "var(--accent-bg)" : "transparent",
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

      {activeTab === "ranking" && candidates.length > 0 && (
        <div className="card-elevated overflow-hidden">
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
        <div className="card-elevated overflow-hidden">
          <MvpHallOfFame entries={hallOfFame} loading={hofLoading} />
        </div>
      )}
    </div>
  );
}

function getDaysUntilVoting(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDate();
  if (day >= 24) return 0;
  return 24 - day;
}

function VotingStatusBadge({ votingOpen }: { votingOpen: boolean }) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(() => (votingOpen ? getVotingTimeRemaining() : null));
  const [daysUntil, setDaysUntil] = useState(() => getDaysUntilVoting());

  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") {
        setTimeRemaining(getVotingTimeRemaining());
        setDaysUntil(getDaysUntilVoting());
      }
    };

    const interval = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div className="text-right">
      {votingOpen ? (
        <div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: "rgba(74,222,128,0.12)",
              color: "var(--color-green)",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            투표 진행중
          </span>
          {timeRemaining && (
            <p className="mt-0.5 font-stat text-xl font-bold text-accent">
              {String(timeRemaining.hours).padStart(2, "0")}:
              {String(timeRemaining.minutes).padStart(2, "0")}:
              {String(timeRemaining.seconds).padStart(2, "0")}
            </p>
          )}
        </div>
      ) : (
        <div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: "rgba(212,168,83,0.12)",
              color: "var(--color-accent)",
              border: "1px solid rgba(212,168,83,0.3)",
            }}
          >
            클립 수집중
          </span>
          {daysUntil > 0 && (
            <p className="mt-0.5 text-[11px] text-text-3">
              투표까지 <span className="font-stat font-bold text-accent">D-{daysUntil}</span>
            </p>
          )}
        </div>
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
    <div className="card-elevated flex flex-col items-center gap-1 px-4 py-4">
      <span className="text-[14px]">{icon}</span>
      <span className="font-stat text-[18px] font-bold text-text-1">{value}</span>
      <span className="text-[10px] text-text-3">{label}</span>
    </div>
  );
}
