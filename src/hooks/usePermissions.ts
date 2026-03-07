"use client";

import { useMemo } from "react";
import { useProfile } from "./useProfile";
import {
  canUploadClip,
  canVoteMvp,
  canFollow,
  canDm,
  canScoutReview,
  canUseWatchlist,
  type UserRole,
} from "@/lib/permissions";

interface UsePermissionsOptions {
  enabled?: boolean;
}

export function usePermissions({ enabled = true }: UsePermissionsOptions = {}) {
  const { profile, loading, error } = useProfile({ enabled });

  return useMemo(() => {
    const role: UserRole = profile?.role ?? "player";
    const verified = profile?.isVerified ?? false;

    return {
      loading,
      error,
      role,
      verified,
      userId: profile?.id ?? null,
      canUploadClip: canUploadClip(role),
      canVoteMvp: canVoteMvp(role),
      canFollow: canFollow(role),
      canScoutReview: canScoutReview(role, verified),
      canUseWatchlist: canUseWatchlist(role, verified),
      canDm: (targetRole: UserRole, isFollowing: boolean, isSameTeam: boolean) =>
        canDm(role, verified, targetRole, isFollowing, isSameTeam),
    };
  }, [error, loading, profile?.id, profile?.isVerified, profile?.role]);
}
