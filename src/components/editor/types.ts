export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

export interface PlayerData {
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  club: string;
  customClubName: string;
  customClubColor: string;
  customClubAccent: string;
  age: string;
  birthDate: string;
  height: string;
  weight: string;
  foot: string;
  nationality: string;
  photoUrl: string;
  stats: PlayerStats;
}

export const DEFAULT_STATS: PlayerStats = {
  pace: 70,
  shooting: 65,
  passing: 60,
  dribbling: 72,
  defense: 45,
  physical: 58,
};

export const STAT_LABELS: Record<keyof PlayerStats, { en: string; ko: string }> = {
  pace: { en: "PAC", ko: "속도" },
  shooting: { en: "SHO", ko: "슈팅" },
  passing: { en: "PAS", ko: "패스" },
  dribbling: { en: "DRI", ko: "드리블" },
  defense: { en: "DEF", ko: "수비" },
  physical: { en: "PHY", ko: "체력" },
};

export const DEFAULT_PLAYER_DATA: PlayerData = {
  firstName: "",
  lastName: "",
  number: "9",
  position: "ST",
  club: "FC Seoul U12",
  customClubName: "",
  customClubColor: "#37474F",
  customClubAccent: "#78909C",
  age: "",
  birthDate: "",
  height: "",
  weight: "",
  foot: "오른발",
  nationality: "KOREA",
  photoUrl: "",
  stats: DEFAULT_STATS,
};
