"use client";

import type { HudPlayerData } from "@/components/video/hud/types";

interface PlayerCardData {
  card_data?: Record<string, string>;
  club_name?: string | null;
  main_color?: string | null;
  accent_color?: string | null;
}

interface PlayerCardProfile {
  avatar_url?: string | null;
}

export interface PlayerCardResponse {
  card?: PlayerCardData | null;
  profile?: PlayerCardProfile | null;
}

const DEFAULT_PLAYER_CARD_CACHE_KEY = "__default__";

const cachedPlayerCards = new Map<string, PlayerCardResponse | null>();
const inflightPlayerCards = new Map<string, Promise<PlayerCardResponse | null>>();

function getPlayerCardCacheKey(profileId?: string | null) {
  return profileId?.trim() || DEFAULT_PLAYER_CARD_CACHE_KEY;
}

function getPlayerCardRequestUrl(profileId?: string | null) {
  return profileId ? `/api/player-card?profileId=${encodeURIComponent(profileId)}` : "/api/player-card";
}

export function getCachedPlayerCard(profileId?: string | null): PlayerCardResponse | null {
  return cachedPlayerCards.get(getPlayerCardCacheKey(profileId)) ?? null;
}

export async function preloadPlayerCard(profileId?: string | null): Promise<PlayerCardResponse | null> {
  const cacheKey = getPlayerCardCacheKey(profileId);
  const cached = cachedPlayerCards.get(cacheKey);
  if (cached) return cached;

  const inflight = inflightPlayerCards.get(cacheKey);
  if (inflight) return inflight;

  const request = fetch(getPlayerCardRequestUrl(profileId), { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      cachedPlayerCards.set(cacheKey, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflightPlayerCards.delete(cacheKey);
    });

  inflightPlayerCards.set(cacheKey, request);
  return request;
}

export function buildHudPlayerData(
  response: PlayerCardResponse | null | undefined
): HudPlayerData | null {
  if (!response?.card) return null;

  const cd = response.card.card_data ?? {};

  return {
    name: cd.name || `${cd.lastName || ""}${cd.firstName || ""}`.trim() || "",
    number: cd.number || "9",
    position: cd.position || "ST",
    club:
      cd.club === "직접 입력"
        ? cd.customClubName || cd.teamName || response.card.club_name || ""
        : cd.club || cd.teamName || response.card.club_name || "",
    age: cd.age || "",
    birthDate: cd.birthDate || "",
    height: cd.height || "",
    weight: cd.weight || "",
    foot: cd.foot || "",
    nationality: cd.nationality || "KOREA",
    photoUrl:
      cd.photoUrl && !cd.photoUrl.startsWith("blob:")
        ? cd.photoUrl
        : response.profile?.avatar_url || "",
    mainColor: response.card.main_color || "#37474F",
    accentColor: response.card.accent_color || "#D4A853",
  };
}

export function buildFallbackHudPlayerData(clip: {
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
}): HudPlayerData | null {
  if (!clip.playerName) return null;

  return {
    name: clip.playerName,
    number: "",
    position: clip.playerPosition || "FW",
    club: clip.teamName || "",
    age: "",
    birthDate: clip.playerBirthYear ? `${clip.playerBirthYear}` : "",
    height: "",
    weight: "",
    foot: "",
    nationality: "KOREA",
    photoUrl: "",
    mainColor: "#37474F",
    accentColor: "#D4A853",
  };
}
