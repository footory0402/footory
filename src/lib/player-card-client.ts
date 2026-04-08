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

let cachedPlayerCard: PlayerCardResponse | null = null;
let inflightPlayerCard: Promise<PlayerCardResponse | null> | null = null;

export function getCachedPlayerCard(): PlayerCardResponse | null {
  return cachedPlayerCard;
}

export async function preloadPlayerCard(): Promise<PlayerCardResponse | null> {
  if (cachedPlayerCard) return cachedPlayerCard;
  if (inflightPlayerCard) return inflightPlayerCard;

  inflightPlayerCard = fetch("/api/player-card")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      cachedPlayerCard = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflightPlayerCard = null;
    });

  return inflightPlayerCard;
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
        ? cd.customClubName || response.card.club_name || ""
        : cd.club || "",
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
