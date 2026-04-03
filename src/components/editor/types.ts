export interface PlayerData {
  name: string;
  number: string;
  position: string;
  teamName: string;
  themeId: string;
  customClubColor: string;
  customClubAccent: string;
  age: string;
  birthDate: string;
  height: string;
  weight: string;
  foot: string;
  nationality: string;
  photoUrl: string;
}

export const DEFAULT_PLAYER_DATA: PlayerData = {
  name: "",
  number: "9",
  position: "ST",
  teamName: "",
  themeId: "flame",
  customClubColor: "#7B1315",
  customClubAccent: "#F97316",
  age: "",
  birthDate: "",
  height: "",
  weight: "",
  foot: "오른발",
  nationality: "KOREA",
  photoUrl: "",
};
