import { MVP_AUTO_WEIGHT, MVP_VOTE_WEIGHT, MVP_TIERS, type MvpTierKey } from "./constants";

// ── Types ─────────────────────────────────────────────────

export interface ClipWithStats {
  id: string;
  owner_id: string;
  views_count: number;
  kudos_count: number;
  comments_count: number;
}

export interface CandidateScore {
  clipId: string;
  ownerId: string;
  autoRaw: number;
  voteRaw: number;
  autoNorm: number;
  voteNorm: number;
  totalScore: number;
  voteCount: number;
}

// ── Auto Score ────────────────────────────────────────────

/**
 * Raw auto score for a clip:
 *   views * 1 + kudos * 3 + comments * 2
 */
export function calcAutoRaw(clip: ClipWithStats): number {
  return (
    clip.views_count * 1 +
    clip.kudos_count * 3 +
    clip.comments_count * 2
  );
}

// ── Normalize + Combine ───────────────────────────────────

/**
 * Normalize auto and vote scores across all candidates and
 * combine at 70:30 ratio.
 *
 * autoNorm out of 400, voteNorm out of 600 => total out of 1000
 */
export function rankCandidates(
  clips: ClipWithStats[],
  voteCounts: Record<string, number> // clipId → vote count
): CandidateScore[] {
  if (clips.length === 0) return [];

  // Calculate raw scores
  const rawScores = clips.map((clip) => ({
    clipId: clip.id,
    ownerId: clip.owner_id,
    autoRaw: calcAutoRaw(clip),
    voteRaw: (voteCounts[clip.id] ?? 0) * 10,
    voteCount: voteCounts[clip.id] ?? 0,
  }));

  // Find maximums for normalization
  const maxAuto = Math.max(...rawScores.map((s) => s.autoRaw), 1);
  const maxVote = Math.max(...rawScores.map((s) => s.voteRaw), 1);

  // Normalize and combine
  const scored: CandidateScore[] = rawScores.map((s) => {
    const autoNorm = (s.autoRaw / maxAuto) * (MVP_AUTO_WEIGHT * 1000); // out of 700
    const voteNorm = (s.voteRaw / maxVote) * (MVP_VOTE_WEIGHT * 1000); // out of 300
    return {
      ...s,
      autoNorm: Math.round(autoNorm),
      voteNorm: Math.round(voteNorm),
      totalScore: Math.round(autoNorm + voteNorm),
    };
  });

  // Sort descending by totalScore
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Deduplicate by owner: keep only the highest-scoring clip per player
  const seen = new Set<string>();
  const deduped: CandidateScore[] = [];
  for (const s of scored) {
    if (!seen.has(s.ownerId)) {
      seen.add(s.ownerId);
      deduped.push(s);
    }
  }

  return deduped;
}

// ── MVP Tier ──────────────────────────────────────────────

/**
 * Given cumulative MVP win count, return the tier key or null.
 */
export function getMvpTier(mvpCount: number): MvpTierKey | null {
  // Iterate from highest to lowest
  for (let i = MVP_TIERS.length - 1; i >= 0; i--) {
    if (mvpCount >= MVP_TIERS[i].minCount) {
      return MVP_TIERS[i].tier;
    }
  }
  return null;
}

/**
 * Return the tier display info (name, icon, color) for a given tier key.
 */
export function getMvpTierInfo(tier: MvpTierKey | null) {
  if (!tier) return null;
  return MVP_TIERS.find((t) => t.tier === tier) ?? null;
}

// ── Month Helpers ─────────────────────────────────────────

/**
 * Get the 1st day of the month for the given date in KST.
 * Returns YYYY-MM-DD string.
 */
export function getMonthStart(date: Date = new Date()): string {
  // Convert to KST (UTC+9)
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** @deprecated Use getMonthStart instead */
export function getWeekStart(date: Date = new Date()): string {
  return getMonthStart(date);
}

/**
 * Check if current time (KST) is within voting window.
 * 월말 마지막 7일간(24일~말일) 투표 가능.
 * 1일 00:00~05:59 KST는 집계 시간으로 투표 불가.
 */
export function isVotingOpen(): boolean {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDate();
  const hour = kst.getUTCHours();

  // 1일 00:00~05:59 KST = aggregation window
  if (day === 1 && hour < 6) return false;

  // 24일~말일 투표 가능
  if (day >= 24) return true;

  return false;
}

/**
 * Get remaining time until voting window closes (month end 23:59:59 KST).
 * Returns { hours, minutes, seconds } or null if not in voting window.
 */
export function getVotingTimeRemaining(now: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!isVotingOpen()) return null;

  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // Calculate end of month 23:59:59 KST
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth();
  // Last day of current month
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const end = new Date(Date.UTC(year, month, lastDay, 23, 59, 59, 999));

  const diffMs = end.getTime() - kst.getTime();
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * Format a month range string: "3월"
 */
export function formatMonthRange(monthStart: string): string {
  const start = new Date(monthStart + "T00:00:00");
  const m = start.getMonth() + 1;
  return `${m}월`;
}

/** @deprecated Use formatMonthRange instead */
export function formatWeekRange(weekStart: string): string {
  return formatMonthRange(weekStart);
}
