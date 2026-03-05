import { MVP_AUTO_WEIGHT, MVP_VOTE_WEIGHT, MVP_TIERS, type MvpTierKey } from "./constants";

// ── Types ─────────────────────────────────────────────────

export interface ClipWithStats {
  id: string;
  owner_id: string;
  views_count: number;
  kudos_count: number;
  comments_count: number;
  profile_visits: number;
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
 *   views * 1 + kudos * 3 + comments * 2 + profile_visits * 2
 */
export function calcAutoRaw(clip: ClipWithStats): number {
  return (
    clip.views_count * 1 +
    clip.kudos_count * 3 +
    clip.comments_count * 2 +
    clip.profile_visits * 2
  );
}

// ── Normalize + Combine ───────────────────────────────────

/**
 * Normalize auto and vote scores across all candidates and
 * combine at 70:30 ratio.
 *
 * autoNorm out of 700, voteNorm out of 300 => total out of 1000
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
  return scored;
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

// ── Week Helpers ──────────────────────────────────────────

/**
 * Get the Monday (week start) of the given date in KST.
 * Returns YYYY-MM-DD string.
 */
export function getWeekStart(date: Date = new Date()): string {
  // Convert to KST (UTC+9)
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() - diff);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Check if current time (KST) is within voting window.
 * 현재는 상시 투표 가능 (추후 시즌제 도입 시 제한 가능)
 */
export function isVotingOpen(): boolean {
  return true;
}

/**
 * Get remaining time until voting window closes (Sunday 23:59:59 KST).
 * Returns { hours, minutes, seconds } or null if not in voting window.
 */
export function getVotingTimeRemaining(now: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!isVotingOpen()) return null;

  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay();

  // Calculate end of Sunday 23:59:59 KST
  const daysUntilSundayEnd = day === 6 ? 1 : 0;
  const end = new Date(kst);
  end.setUTCDate(kst.getUTCDate() + daysUntilSundayEnd);
  end.setUTCHours(23, 59, 59, 999);

  const diffMs = end.getTime() - kst.getTime();
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * Format a week range string: "M.DD ~ M.DD"
 */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();

  return `${sm}.${String(sd).padStart(2, "0")} ~ ${em}.${String(ed).padStart(2, "0")}`;
}
