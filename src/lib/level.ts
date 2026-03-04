/**
 * Level calculation based on ARCHITECTURE.md Section 7.
 * Returns level 1-5 based on profile completeness and activity.
 *
 * Level requirements:
 *   Lv.1 (루키):   default
 *   Lv.2 (스타터): avatar + name + position + birth_year
 *   Lv.3 (레귤러): featured >= 1 AND stats >= 1
 *   Lv.4 (에이스): top clips >= 2 AND medals >= 1
 *   Lv.5 (올스타): seasons >= 1 AND featured >= 2
 */
export interface LevelCounts {
  featuredCount: number;
  statsCount: number;
  topClipsCount: number;
  medalsCount: number;
  seasonsCount: number;
}

export function calculateLevel(
  profile: { avatar_url: string | null; name: string; position: string | null; birth_year: number | null },
  counts: LevelCounts
): number {
  let lv = 1;

  // Lv.2: profile complete
  if (profile.avatar_url && profile.name && profile.position && profile.birth_year) {
    lv = 2;
  }

  // Lv.3: featured + stat
  if (lv >= 2 && counts.featuredCount >= 1 && counts.statsCount >= 1) {
    lv = 3;
  }

  // Lv.4: top clips + medal
  if (lv >= 3 && counts.topClipsCount >= 2 && counts.medalsCount >= 1) {
    lv = 4;
  }

  // Lv.5: season + 2 featured
  if (lv >= 4 && counts.seasonsCount >= 1 && counts.featuredCount >= 2) {
    lv = 5;
  }

  return lv;
}

/**
 * Estimate XP based on level counts.
 * Maps activity counts to approximate XP matching the LEVELS thresholds:
 *   Lv.1: 0, Lv.2: 100, Lv.3: 300, Lv.4: 600, Lv.5: 1000
 *
 * Each criterion partially contributes XP toward the next level threshold.
 */
export function estimateXp(
  profile: { avatar_url: string | null; name: string; position: string | null; birth_year: number | null },
  counts: LevelCounts
): number {
  let xp = 0;

  // Profile fields (25 XP each, up to 100 total for Lv.2)
  if (profile.avatar_url) xp += 25;
  if (profile.name) xp += 25;
  if (profile.position) xp += 25;
  if (profile.birth_year) xp += 25;

  // Featured clips (100 XP each)
  xp += Math.min(counts.featuredCount, 3) * 100;

  // Stats (50 XP each, max 200)
  xp += Math.min(counts.statsCount, 4) * 50;

  // Top clips (75 XP each, max 150)
  xp += Math.min(counts.topClipsCount, 2) * 75;

  // Medals (50 XP each, max 150)
  xp += Math.min(counts.medalsCount, 3) * 50;

  // Seasons (100 XP each, max 200)
  xp += Math.min(counts.seasonsCount, 2) * 100;

  return xp;
}

/**
 * Returns a human-readable hint for what to do next to level up.
 */
export function getNextLevelHint(level: number, counts: LevelCounts): string | null {
  switch (level) {
    case 1:
      return "프로필 사진과 기본 정보를 등록하세요";
    case 2: {
      const hints: string[] = [];
      if (counts.featuredCount < 1) hints.push("대표 영상 등록");
      if (counts.statsCount < 1) hints.push("측정 기록 추가");
      return hints.length > 0 ? hints.join(" + ") : null;
    }
    case 3: {
      const hints: string[] = [];
      if (counts.topClipsCount < 2) hints.push(`대표 태그 클립 ${2 - counts.topClipsCount}개 추가`);
      if (counts.medalsCount < 1) hints.push("메달 획득");
      return hints.length > 0 ? hints.join(" + ") : null;
    }
    case 4: {
      const hints: string[] = [];
      if (counts.seasonsCount < 1) hints.push("시즌 기록 추가");
      if (counts.featuredCount < 2) hints.push(`대표 영상 ${2 - counts.featuredCount}개 추가`);
      return hints.length > 0 ? hints.join(" + ") : null;
    }
    default:
      return null; // max level
  }
}
