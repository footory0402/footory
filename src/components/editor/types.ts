export interface PlayerData {
  name: string;
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
}

export const DEFAULT_PLAYER_DATA: PlayerData = {
  name: "",
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
};
