/**
 * Level calculation based on ARCHITECTURE.md Section 6.
 * Returns level 1-5 based on profile completeness and activity.
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
