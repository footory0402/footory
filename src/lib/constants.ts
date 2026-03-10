// Levels
export const LEVELS = [
  { level: 1, name: "시작", icon: "🌱", color: "#71717A", minXp: 0 },
  { level: 2, name: "기본", icon: "📋", color: "#A1A1AA", minXp: 100 },
  { level: 3, name: "성장", icon: "📈", color: "#D4A853", minXp: 300 },
  { level: 4, name: "충실", icon: "⭐", color: "#F5C542", minXp: 600 },
  { level: 5, name: "완성", icon: "🏅", color: "#F5D78E", minXp: 1000 },
] as const;

// Positions
export const POSITIONS = ["FW", "MF", "DF", "GK"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_COLORS: Record<Position, string> = {
  FW: "#F87171",
  MF: "#4ADE80",
  DF: "#60A5FA",
  GK: "#FBBF24",
};

export const POSITION_LABELS: Record<Position, string> = {
  FW: "공격수",
  MF: "미드필더",
  DF: "수비수",
  GK: "골키퍼",
};

// Skill Tags — 포지션별 필터링, 쉬운 한글 이름
// DB DDL tag_name CHECK과 일치하도록 dbName 유지
export const SKILL_TAGS = [
  // 필드 선수 공통 (FW/MF/DF)
  { id: "dribble", dbName: "1v1 돌파", label: "드리블", emoji: "⚽", forGK: false },
  { id: "shoot", dbName: "슈팅", label: "슈팅", emoji: "🦵", forGK: false },
  { id: "first_touch", dbName: "퍼스트터치", label: "볼컨트롤", emoji: "🎯", forGK: false },
  { id: "pass", dbName: "전진패스", label: "패스", emoji: "🏐", forGK: false },
  { id: "defense", dbName: "1v1 수비", label: "수비", emoji: "🛡️", forGK: false },
  // GK 전용
  { id: "gk_save", dbName: "세이브", label: "세이브", emoji: "🧤", forGK: true },
  { id: "gk_distribution", dbName: "배급", label: "배급", emoji: "🦶", forGK: true },
  { id: "gk_1v1_save", dbName: "1v1세이브", label: "1대1", emoji: "🛑", forGK: true },
  // 공통
  { id: "etc", dbName: "기타", label: "스페셜", emoji: "⭐", forGK: false },
] as const;

/** 포지션에 맞는 태그만 반환 */
export function getSkillTagsForPosition(position?: string | null) {
  if (position === "GK") {
    return SKILL_TAGS.filter((t) => t.forGK || t.id === "etc");
  }
  return SKILL_TAGS.filter((t) => !t.forGK);
}

export type SkillTagDbName = (typeof SKILL_TAGS)[number]["dbName"];

// Measurement Types — 쉬운 이름, 전부 선택 (필수 없음)
export const MEASUREMENTS = [
  { id: "sprint_50m", label: "50m 달리기", unit: "초", icon: "🏃", lowerIsBetter: true },
  { id: "juggling", label: "리프팅", unit: "회", icon: "⚽", lowerIsBetter: false },
  { id: "kick_power", label: "슈팅 속도", unit: "km/h", icon: "🦵", lowerIsBetter: false },
  { id: "run_1000m", label: "1000m 달리기", unit: "분:초", icon: "🏃‍♂️", lowerIsBetter: true },
  { id: "shuttle_run", label: "왕복달리기", unit: "회", icon: "🔄", lowerIsBetter: false },
  { id: "vertical_jump", label: "제자리멀리뛰기", unit: "cm", icon: "⬆️", lowerIsBetter: false },
] as const;

export const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
  sprint_50m: { min: 5.5, max: 12 },
  juggling: { min: 1, max: 3000 },
  kick_power: { min: 20, max: 150 },
  run_1000m: { min: 180, max: 600 },
  shuttle_run: { min: 10, max: 150 },
  vertical_jump: { min: 10, max: 80 },
} as const;

// MVP Tiers
export const MVP_TIERS = [
  { tier: "rookie", name: "루키", icon: "⭐", minCount: 1, color: "#A1A1AA" },
  { tier: "ace", name: "에이스", icon: "🌟", minCount: 3, color: "#D4A853" },
  { tier: "allstar", name: "올스타", icon: "👑", minCount: 5, color: "#F5C542" },
  { tier: "legend", name: "레전드", icon: "💎", minCount: 10, color: "#F5D78E" },
] as const;

export type MvpTierKey = (typeof MVP_TIERS)[number]["tier"];

// Weekly MVP Voting
export const MAX_WEEKLY_VOTES = 5;
export const MVP_AUTO_WEIGHT = 0.4;
export const MVP_VOTE_WEIGHT = 0.6;

// App constants
export const MAX_HIGHLIGHT_SECONDS = 30;
export const MAX_FEATURED_SLOTS = 3;
export const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
export const NOTIFICATION_POLL_MS = 30_000;
export const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app";
