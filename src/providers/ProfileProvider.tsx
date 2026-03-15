"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  role: "player" | "parent" | "scout";
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

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hydrateProfile: (data: Record<string, unknown>) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  error: null,
  refetch: async () => {},
  hydrateProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const fetchedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
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

  // 서버에서 가져온 프로필 데이터 주입 (ProfileHydrator에서 호출)
  const hydrateProfile = useCallback((data: Record<string, unknown>) => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    fetchedRef.current = true; // auto-fetch 방지
    setProfile(toProfile(data as unknown as ProfileApiResponse));
    setLoading(false);
    setError(null);
  }, []);

  // 서버 hydration이 없는 페이지에서만 자동 fetch (예: /mvp, /discover)
  useEffect(() => {
    if (fetchedRef.current) return;
    // 짧은 딜레이로 ProfileHydrator가 먼저 실행될 기회 부여
    const timer = setTimeout(() => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      void fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const value = useMemo(
    () => ({ profile, loading, error, refetch: fetchProfile, hydrateProfile }),
    [profile, loading, error, fetchProfile, hydrateProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  return useContext(ProfileContext);
}
