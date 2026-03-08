"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";
import type { Profile } from "@/lib/types";

interface UseProfileOptions {
  enabled?: boolean;
}

/**
 * Uses shared ProfileProvider context to avoid duplicate fetches.
 * updateProfile/uploadAvatar/checkHandle are additional utilities.
 */
export function useProfile({ enabled = true }: UseProfileOptions = {}) {
  const ctx = useProfileContext();
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);

  // Sync local state with context
  useEffect(() => {
    if (ctx.profile) setLocalProfile(ctx.profile);
  }, [ctx.profile]);

  const profile = enabled ? (localProfile ?? ctx.profile) : null;
  const loading = enabled ? ctx.loading : false;
  const error = enabled ? ctx.error : null;

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!profile) return;

      const prev = profile;
      setLocalProfile({ ...profile, ...updates } as Profile);

      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Update failed");
        }
        await ctx.refetch();
      } catch (e) {
        setLocalProfile(prev);
        throw e;
      }
    },
    [profile, ctx]
  );

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Upload failed");
    }
    const { avatarUrl } = await res.json();
    setLocalProfile((p) => (p ? { ...p, avatarUrl } : p));
  }, []);

  const checkHandle = useCallback(async (handle: string): Promise<boolean> => {
    const res = await fetch(`/api/profile/handle-check?handle=${encodeURIComponent(handle)}`);
    const { available } = await res.json();
    return available;
  }, []);

  return { profile, loading, error, updateProfile, uploadAvatar, checkHandle, refetch: ctx.refetch };
}
