"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/lib/types";
import type { Position } from "@/lib/constants";

interface ProfileApiResponse {
  id: string;
  handle: string;
  name: string;
  position: Position | null;
  birth_year: number | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  level: number;
  role: "player" | "parent" | "other";
  followers_count: number;
  following_count: number;
  views_count: number;
  public_email: string | null;
  public_phone: string | null;
  show_email: boolean;
  show_phone: boolean;
  created_at: string;
  teamName: string | null;
  teamId: string | null;
  mvp_count: number;
  mvp_tier: "rookie" | "ace" | "allstar" | "legend" | null;
  is_verified: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
  xp?: number;
  counts?: {
    featuredCount: number;
    statsCount: number;
    topClipsCount: number;
    medalsCount: number;
    seasonsCount: number;
  };
}

function toProfile(data: ProfileApiResponse): Profile {
  return {
    id: data.id,
    handle: data.handle,
    name: data.name,
    position: data.position,
    birthYear: data.birth_year,
    city: data.city,
    teamName: data.teamName ?? undefined,
    teamId: data.teamId ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
    level: data.level,
    xp: data.xp ?? 0,
    bio: data.bio ?? undefined,
    followers: data.followers_count,
    following: data.following_count,
    views: data.views_count,
    contact: {
      email: data.public_email ?? undefined,
      phone: data.public_phone ?? undefined,
    },
    contactPublic: data.show_email || data.show_phone,
    role: data.role,
    isVerified: data.is_verified ?? false,
    heightCm: data.height_cm,
    weightKg: data.weight_kg,
    preferredFoot: data.preferred_foot,
    mvpCount: data.mvp_count ?? 0,
    mvpTier: data.mvp_tier ?? null,
    createdAt: data.created_at,
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          setError("not_authenticated");
          return;
        }
        throw new Error("Failed to fetch profile");
      }
      const data: ProfileApiResponse = await res.json();
      setProfile(toProfile(data));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!profile) return;

      // Optimistic update
      const prev = profile;
      setProfile({ ...profile, ...updates } as Profile);

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
        // Refetch to get accurate server state
        await fetchProfile();
      } catch (e) {
        setProfile(prev); // rollback
        throw e;
      }
    },
    [profile, fetchProfile]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
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
      setProfile((p) => (p ? { ...p, avatarUrl } : p));
    },
    []
  );

  const checkHandle = useCallback(async (handle: string): Promise<boolean> => {
    const res = await fetch(`/api/profile/handle-check?handle=${encodeURIComponent(handle)}`);
    const { available } = await res.json();
    return available;
  }, []);

  return { profile, loading, error, updateProfile, uploadAvatar, checkHandle, refetch: fetchProfile };
}
