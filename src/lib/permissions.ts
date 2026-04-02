export type UserRole = "player" | "parent" | "scout";
export type DmActionState = "allowed" | "blocked" | "hidden";

interface DmActionOptions {
  senderRole: UserRole | null;
  senderVerified: boolean;
  targetRole: UserRole;
  isFollowing: boolean;
  isSameTeam: boolean;
  isBlocked: boolean;
  targetIsMinor: boolean;
}

export interface DmAction {
  state: DmActionState;
  label: string;
  message?: string;
}

/** 선수만 클립 업로드 가능 */
export function canUploadClip(role: UserRole): boolean {
  return role === "player";
}

/** 선수만 MVP 투표 가능 (부모/스카우터는 어뷰징 방지) */
export function canVoteMvp(role: UserRole): boolean {
  return role === "player";
}

/** 선수만 팔로우 가능 */
export function canFollow(role: UserRole): boolean {
  return role === "player";
}

/** DM 전송 권한 — 차단 외에는 모두 허용 */
export function canDm(): boolean {
  return true;
}

export function getDmAction({
  senderRole,
  isBlocked,
}: DmActionOptions): DmAction {
  if (!senderRole) {
    return {
      state: "hidden",
      label: "메시지",
    };
  }

  if (isBlocked) {
    return {
      state: "blocked",
      label: "메시지 불가",
      message: "차단된 사용자와는 대화할 수 없어요.",
    };
  }

  return {
    state: "allowed",
    label: "메시지",
  };
}

/** 스카우터 리뷰 작성 권한 (인증된 스카우터만) */
export function canScoutReview(role: UserRole, verified: boolean): boolean {
  return role === "scout" && verified;
}

/** 관심 선수 리스트 (인증된 스카우터만) */
export function canUseWatchlist(role: UserRole, verified: boolean): boolean {
  return role === "scout" && verified;
}
