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
] as const;

// 구버전 stat_type → 한글 레이블 폴백 (DB에 옛 타입이 남아 있을 때)
export const STAT_TYPE_LABEL_FALLBACK: Record<string, { label: string; unit: string; icon: string }> = {
  sprint_30m: { label: "30m 달리기", unit: "초", icon: "🏃" },
  "30m_sprint": { label: "30m 달리기", unit: "초", icon: "🏃" },
  "1000m_run": { label: "1000m 달리기", unit: "분:초", icon: "🏃‍♂️" },
};

export function getStatMeta(statType: string): { label: string; unit: string; icon: string; lowerIsBetter?: boolean } {
  const m = MEASUREMENTS.find((m) => m.id === statType);
  if (m) return m;
  return STAT_TYPE_LABEL_FALLBACK[statType] ?? { label: statType, unit: "", icon: "📊" };
}

export const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
  sprint_50m: { min: 5.5, max: 12 },
  juggling: { min: 1, max: 3000 },
  kick_power: { min: 20, max: 150 },
  run_1000m: { min: 180, max: 600 },
} as const;

// 연령별 스탯 범위 (어뷰징 방지)
// age group key: "u10" = ~9세, "u12" = 10~11세, "u15" = 12~14세, "u18" = 15~17세, "adult" = 18+
export type AgeGroup = "u10" | "u12" | "u15" | "u18" | "adult";

export const AGE_STAT_BOUNDS: Record<string, Record<AgeGroup, { min: number; max: number; warn: number }>> = {
  sprint_50m: {
    u10:   { min: 6.5, max: 15, warn: 7.5 },
    u12:   { min: 6.0, max: 15, warn: 7.0 },
    u15:   { min: 5.5, max: 15, warn: 6.5 },
    u18:   { min: 5.0, max: 15, warn: 6.0 },
    adult: { min: 5.0, max: 15, warn: 5.5 },
  },
  juggling: {
    u10:   { min: 1, max: 3000, warn: 500 },
    u12:   { min: 1, max: 5000, warn: 1000 },
    u15:   { min: 1, max: 10000, warn: 3000 },
    u18:   { min: 1, max: 15000, warn: 5000 },
    adult: { min: 1, max: 20000, warn: 10000 },
  },
  kick_power: {
    u10:   { min: 10, max: 80, warn: 50 },
    u12:   { min: 10, max: 100, warn: 70 },
    u15:   { min: 10, max: 130, warn: 100 },
    u18:   { min: 10, max: 150, warn: 120 },
    adult: { min: 10, max: 170, warn: 140 },
  },
  run_1000m: {
    u10:   { min: 200, max: 600, warn: 240 },
    u12:   { min: 190, max: 600, warn: 220 },
    u15:   { min: 180, max: 600, warn: 210 },
    u18:   { min: 170, max: 600, warn: 195 },
    adult: { min: 160, max: 600, warn: 180 },
  },
} as const;

/** 생년으로 연령 그룹 결정 */
export function getAgeGroup(birthYear: number | null | undefined): AgeGroup {
  if (!birthYear) return "u15"; // 기본값: 중간 범위
  const age = new Date().getFullYear() - birthYear;
  if (age < 10) return "u10";
  if (age < 12) return "u12";
  if (age < 15) return "u15";
  if (age < 18) return "u18";
  return "adult";
}

/** 연령별 범위 경고 메시지 반환 (null = 정상) */
export function getStatWarning(
  statType: string,
  value: number,
  birthYear: number | null | undefined
): { type: "blocked" | "warning"; message: string } | null {
  const ageBounds = AGE_STAT_BOUNDS[statType];
  if (!ageBounds) return null;

  const group = getAgeGroup(birthYear);
  const bounds = ageBounds[group];

  // 범위 초과 → 차단
  if (value < bounds.min || value > bounds.max) {
    return {
      type: "blocked",
      message: `이 연령대(${group.toUpperCase()})에서 입력 가능한 범위를 벗어났습니다`,
    };
  }

  // 경고 범위 (lowerIsBetter 종목은 warn 이하, 아니면 warn 이상)
  const measurement = MEASUREMENTS.find((m) => m.id === statType);
  const lowerIsBetter = measurement?.lowerIsBetter ?? false;
  const isExceptional = lowerIsBetter ? value <= bounds.warn : value >= bounds.warn;

  if (isExceptional) {
    return {
      type: "warning",
      message: `이 기록은 해당 연령대에서 매우 뛰어난 수준입니다. 정확한 기록인지 확인해주세요.`,
    };
  }

  return null;
}

// Percentile → 유소년 친화 등급
export const PERCENTILE_TIERS = [
  { min: 90, label: "최상위", emoji: "💎", color: "#D4A853", bg: "rgba(212,168,83,0.15)" },
  { min: 75, label: "뛰어남", emoji: "🥇", color: "#D4A853", bg: "rgba(212,168,83,0.10)" },
  { min: 50, label: "우수",   emoji: "🥈", color: "#A1A1AA", bg: "rgba(161,161,170,0.10)" },
] as const;

/** 백분위 → 등급 변환 (하위 50%는 null → 성장 메시지로 대체) */
export function getPercentileTier(percentile: number) {
  for (const tier of PERCENTILE_TIERS) {
    if (percentile >= tier.min) return tier;
  }
  return null; // 하위 50% → 순위 숨김, 성장 포커스
}

// MVP Tiers (monthly 기준)
export const MVP_TIERS = [
  { tier: "rookie", name: "루키", icon: "⭐", minCount: 1, color: "#A1A1AA" },
  { tier: "ace", name: "에이스", icon: "🌟", minCount: 2, color: "#D4A853" },
  { tier: "allstar", name: "올스타", icon: "👑", minCount: 4, color: "#F5C542" },
  { tier: "legend", name: "레전드", icon: "💎", minCount: 8, color: "#F5D78E" },
] as const;

export type MvpTierKey = (typeof MVP_TIERS)[number]["tier"];

// Monthly MVP Voting
export const MAX_MONTHLY_VOTES = 5;
/** @deprecated Use MAX_MONTHLY_VOTES instead */
export const MAX_WEEKLY_VOTES = MAX_MONTHLY_VOTES;
export const MVP_AUTO_WEIGHT = 0.4;
export const MVP_VOTE_WEIGHT = 0.6;

// App constants
export const MAX_HIGHLIGHT_SECONDS = 30;
export const MAX_FEATURED_SLOTS = 3;
export const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
export const NOTIFICATION_POLL_MS = 30_000;
export const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app";

// FIFA-style Radar Stat Categories
export const RADAR_STATS = [
  { id: "pace", label: "스피드", shortLabel: "SPD", icon: "⚡", color: "#4ADE80" },
  { id: "shooting", label: "슈팅", shortLabel: "SHO", icon: "🦵", color: "#F87171" },
  { id: "passing", label: "패스", shortLabel: "PAS", icon: "🏐", color: "#60A5FA" },
  { id: "dribbling", label: "드리블", shortLabel: "DRI", icon: "⚽", color: "#FBBF24" },
  { id: "defense", label: "수비", shortLabel: "DEF", icon: "🛡️", color: "#A78BFA" },
  { id: "physical", label: "체력", shortLabel: "PHY", icon: "💪", color: "#F472B6" },
] as const;

export type RadarStatId = (typeof RADAR_STATS)[number]["id"];
