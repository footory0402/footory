import type { PlayerData } from "./types";

export function getClubColors(data: PlayerData) {
  return {
    name: data.teamName || "MY TEAM",
    color: data.customClubColor || "#7B1315",
    accent: data.customClubAccent || "#F97316",
  };
}
