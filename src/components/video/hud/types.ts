/** HUD에 표시할 선수 데이터 — Phase 1 PlayerData와 호환 */
export interface HudPlayerData {
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  /** 포지션 약자 (FW, MF, DF, GK) */
  positionShort?: string;
  club: string;
  /** 팀 풀네임 (예: "FC SEOUL U12") */
  clubFull?: string;
  age: string;
  birthDate: string;
  height: string;
  weight: string;
  foot: string;
  nationality: string;
  photoUrl: string;
  mainColor: string;
  accentColor: string;
}

export interface HudConfig {
  showTopBar: boolean;
  showMiniCard: boolean;
  showInfoBar: boolean;
  showGoalCounter: boolean;
  goalCount: number;
}

export const DEFAULT_HUD_CONFIG: HudConfig = {
  showTopBar: true,
  showMiniCard: true,
  showInfoBar: true,
  showGoalCounter: true,
  goalCount: 0,
};
