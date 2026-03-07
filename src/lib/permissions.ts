export type UserRole = "player" | "parent" | "scout";
export type DmActionState = "allowed" | "request" | "blocked" | "hidden";

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

/** DM 전송 권한 */
export function canDm(
  senderRole: UserRole,
  senderVerified: boolean,
  targetRole: UserRole,
  isFollowing: boolean,
  isSameTeam: boolean
): boolean {
  // 인증된 스카우터는 선수에게 DM 가능
  if (senderRole === "scout" && senderVerified && targetRole === "player") {
    return true;
  }
  // 같은 팀이면 DM 가능
  if (isSameTeam) return true;
  // 팔로우 관계면 DM 가능
  if (isFollowing) return true;
  return false;
}

export function getDmAction({
  senderRole,
  senderVerified,
  targetRole,
  isFollowing,
  isSameTeam,
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

  if (senderRole === "parent") {
    if (targetRole === "scout") {
      return {
        state: "request",
        label: "대화 요청",
        message: "상대가 수락하면 대화를 시작할 수 있어요.",
      };
    }

    return {
      state: "blocked",
      label: "메시지 제한",
      message: "보호자 계정은 스카우터에게만 메시지를 보낼 수 있어요.",
    };
  }

  if (senderRole === "scout") {
    if (!senderVerified) {
      return {
        state: "blocked",
        label: "인증 필요",
        message: "인증된 스카우터만 선수나 보호자에게 메시지를 보낼 수 있어요.",
      };
    }

    if (targetRole === "player" || targetRole === "parent") {
      return {
        state: "allowed",
        label: "메시지",
      };
    }

    return {
      state: "blocked",
      label: "메시지 제한",
      message: "스카우터 계정은 선수·보호자에게만 메시지를 보낼 수 있어요.",
    };
  }

  if (senderRole === "player") {
    if (targetRole === "player" && (isSameTeam || isFollowing)) {
      return {
        state: "allowed",
        label: "메시지",
      };
    }

    if (targetRole === "player") {
      return {
        state: "request",
        label: "대화 요청",
        message: "팔로우하거나 같은 팀이면 바로 대화할 수 있어요.",
      };
    }

    return {
      state: "request",
      label: "대화 요청",
      message: "상대가 수락하면 대화를 시작할 수 있어요.",
    };
  }

  return {
    state: "request",
    label: "대화 요청",
    message: "상대가 수락하면 대화를 시작할 수 있어요.",
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
