import { CLUBS } from "./constants";
import type { PlayerData } from "./types";

export function getClubColors(data: PlayerData) {
  // Always use custom colors if they've been set (non-default)
  const hasCustomColors = data.customClubColor !== "#37474F" || data.customClubAccent !== "#78909C";

  if (data.club === "직접 입력" || hasCustomColors) {
    const clubEntry = CLUBS.find((c) => c.name === data.club);
    return {
      name: data.customClubName || data.club || "CUSTOM",
      color: data.customClubColor || clubEntry?.color || "#37474F",
      accent: data.customClubAccent || clubEntry?.accent || "#78909C",
    };
  }

  const club = CLUBS.find((c) => c.name === data.club) ?? CLUBS[0];
  return { name: club.name, color: club.color, accent: club.accent };
}
