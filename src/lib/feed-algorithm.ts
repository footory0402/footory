/**
 * Feed Recommendation Algorithm (Sprint 09)
 *
 * Priority:
 *   1. Followed players' new content
 *   2. Same team members
 *   3. Same city + age group
 *   4. Same position
 *   5. Popular (most kudos)
 *
 * Follow count ratio:
 *   0 follows     → 100% recommended
 *   1-5 follows   → 30% follow / 70% recommended
 *   6-20 follows  → 50% / 50%
 *   21+ follows   → 70% / 30%
 */

export interface UserContext {
  userId: string;
  followingIds: string[];
  teamIds: string[];
  city: string | null;
  birthYear: number | null;
  position: string | null;
  blockedIds?: string[]; // G3: 차단된 사용자 ID 목록
}

export interface FeedRatio {
  followRatio: number;
  recommendRatio: number;
}

/**
 * Determine the follow vs. recommendation ratio based on follow count.
 */
export function getFeedRatio(followCount: number): FeedRatio {
  if (followCount === 0) return { followRatio: 0, recommendRatio: 1 };
  if (followCount <= 5) return { followRatio: 0.3, recommendRatio: 0.7 };
  if (followCount <= 20) return { followRatio: 0.5, recommendRatio: 0.5 };
  return { followRatio: 0.7, recommendRatio: 0.3 };
}

/**
 * Compute recommendation score for a feed item from a given player.
 * Higher = more relevant.
 */
export function computeRecommendationScore(
  ctx: UserContext,
  authorId: string,
  authorTeamIds: string[],
  authorCity: string | null,
  authorBirthYear: number | null,
  authorPosition: string | null,
  kudosCount: number
): number {
  let score = 0;

  // Priority 2: Same team (+40)
  const hasSharedTeam = authorTeamIds.some((tid) => ctx.teamIds.includes(tid));
  if (hasSharedTeam) score += 40;

  // Priority 3: Same city + age group (+30)
  const sameCity = ctx.city && authorCity && ctx.city === authorCity;
  const sameAgeGroup =
    ctx.birthYear != null &&
    authorBirthYear != null &&
    Math.abs(ctx.birthYear - authorBirthYear) <= 2;
  if (sameCity && sameAgeGroup) score += 30;
  else if (sameCity) score += 15;
  else if (sameAgeGroup) score += 10;

  // Priority 4: Same position (+15)
  if (ctx.position && authorPosition && ctx.position === authorPosition) {
    score += 15;
  }

  // Priority 5: Popular — kudos boost (0 ~ 10)
  score += Math.min(10, Math.floor(kudosCount / 3));

  return score;
}

/**
 * Calculate how many items to fetch from follow feed vs recommended feed.
 */
export function computeFeedSplit(
  pageSize: number,
  followCount: number
): { followLimit: number; recommendLimit: number } {
  const { followRatio } = getFeedRatio(followCount);
  const followLimit = Math.round(pageSize * followRatio);
  const recommendLimit = pageSize - followLimit;
  return { followLimit, recommendLimit };
}
