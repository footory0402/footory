"use client";

import { useMemo } from "react";
import { useProfile } from "./useProfile";
import {
  canUploadClip,
  canVoteMvp,
  canFollow,
  canDm,
  canCoachReview,
  canUseWatchlist,
  type UserRole,
} from "@/lib/permissions";

export function usePermissions() {
  const { profile } = useProfile();

  return useMemo(() => {
    const role: UserRole = profile?.role ?? "player";
    const verified = profile?.isVerified ?? false;

    return {
      role,
      verified,
      canUploadClip: canUploadClip(role),
      canVoteMvp: canVoteMvp(role),
      canFollow: canFollow(role),
      canCoachReview: canCoachReview(role, verified),
      canUseWatchlist: canUseWatchlist(role, verified),
      canDm: (targetRole: UserRole, isFollowing: boolean, isSameTeam: boolean) =>
        canDm(role, verified, targetRole, isFollowing, isSameTeam),
    };
  }, [profile?.role, profile?.isVerified]);
}
