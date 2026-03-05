export type UserRole = "player" | "parent" | "other";

/** 선수만 클립 업로드 가능 */
export function canUploadClip(role: UserRole): boolean {
  return role === "player";
}

/** 선수만 MVP 투표 가능 (부모/코치는 어뷰징 방지) */
export function canVoteMvp(role: UserRole): boolean {
  return role === "player";
}

/** 선수만 팔로우 가능 */
export function canFollow(role: UserRole): boolean {
  return role === "player";
}

/** DM 전송 권한 */
export function canDm(
  senderRole: UserRole,
  senderVerified: boolean,
  targetRole: UserRole,
  isFollowing: boolean,
  isSameTeam: boolean
): boolean {
  // 인증된 코치/스카우터는 선수에게 DM 가능
  if (senderRole === "other" && senderVerified && targetRole === "player") {
    return true;
  }
  // 같은 팀이면 DM 가능
  if (isSameTeam) return true;
  // 팔로우 관계면 DM 가능
  if (isFollowing) return true;
  return false;
}

/** 코치 리뷰 작성 권한 (인증된 코치만) */
export function canCoachReview(role: UserRole, verified: boolean): boolean {
  return role === "other" && verified;
}

/** 관심 선수 리스트 (인증된 코치/스카우터만) */
export function canUseWatchlist(role: UserRole, verified: boolean): boolean {
  return role === "other" && verified;
}
