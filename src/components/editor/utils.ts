import { CLUBS } from "./constants";
import type { PlayerData } from "./types";

export function getClubColors(data: PlayerData) {
  if (data.club === "직접 입력") {
    return {
      name: data.customClubName || "CUSTOM",
      color: data.customClubColor,
      accent: data.customClubAccent,
    };
  }
  const club = CLUBS.find((c) => c.name === data.club) ?? CLUBS[0];
  return { name: club.name, color: club.color, accent: club.accent };
}
