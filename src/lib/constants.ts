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

// Skill Tags (7 tags) — DB DDL tag_name CHECK과 일치
export const SKILL_TAGS = [
  { id: "dribble", dbName: "1v1 돌파", label: "1v1 돌파", emoji: "\u26BD" },
  { id: "shoot", dbName: "슈팅", label: "슈팅", emoji: "\uD83E\uDD45" },
  { id: "first_touch", dbName: "퍼스트터치", label: "퍼스트터치", emoji: "\uD83C\uDFAF" },
  { id: "pass", dbName: "전진패스", label: "전진패스", emoji: "\uD83C\uDFAF" },
  { id: "heading", dbName: "헤딩경합", label: "헤딩경합", emoji: "\uD83D\uDCAA" },
  { id: "defense", dbName: "1v1 수비", label: "1v1 수비", emoji: "\uD83D\uDEE1\uFE0F" },
  { id: "etc", dbName: "기타", label: "기타", emoji: "\u2B50" },
] as const;

export type SkillTagDbName = (typeof SKILL_TAGS)[number]["dbName"];

// Measurement Types
export const MEASUREMENTS = [
  { id: "sprint_50m", label: "50m 스프린트", unit: "초", icon: "⏱️", lowerIsBetter: true },
  { id: "shuttle_run", label: "셔틀런", unit: "회", icon: "🔄", lowerIsBetter: false },
  { id: "kick_power", label: "킥 파워", unit: "km/h", icon: "🥅", lowerIsBetter: false },
  { id: "vertical_jump", label: "수직 점프", unit: "cm", icon: "⬆️", lowerIsBetter: false },
  { id: "agility", label: "민첩성", unit: "초", icon: "⚡", lowerIsBetter: true },
  { id: "sprint_30m", label: "30m 스프린트", unit: "초", icon: "🏃", lowerIsBetter: true },
  { id: "run_1000m", label: "1000m 달리기", unit: "초", icon: "🏃‍♂️", lowerIsBetter: true },
  { id: "shooting_accuracy", label: "슈팅 정확도", unit: "%", icon: "⚽", lowerIsBetter: false },
  { id: "juggling", label: "리프팅", unit: "회", icon: "🎯", lowerIsBetter: false },
] as const;

export const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
  sprint_50m: { min: 5.5, max: 12 },
  shuttle_run: { min: 10, max: 150 },
  kick_power: { min: 20, max: 150 },
  vertical_jump: { min: 10, max: 80 },
  agility: { min: 5, max: 30 },
  sprint_30m: { min: 3.5, max: 8 },
  run_1000m: { min: 180, max: 600 },
  shooting_accuracy: { min: 1, max: 30 },
  juggling: { min: 1, max: 3000 },
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
