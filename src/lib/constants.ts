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
  { id: "sprint_50m",   label: "50m 달리기",   unit: "초",   icon: "🏃",  lowerIsBetter: true  },
  { id: "juggling",     label: "리프팅",        unit: "회",   icon: "⚽",  lowerIsBetter: false },
  { id: "kick_power",   label: "슈팅 속도",     unit: "km/h", icon: "🦵",  lowerIsBetter: false },
  { id: "run_1000m",    label: "1000m 달리기",  unit: "분:초", icon: "🏃‍♂️", lowerIsBetter: true  },
  { id: "push_ups",     label: "팔굽혀펴기",    unit: "회",   icon: "💪",  lowerIsBetter: false },
  { id: "sargent_jump", label: "서전트 점프",   unit: "cm",   icon: "🦘",  lowerIsBetter: false },
] as const;

// 구버전 stat_type → 한글 레이블 폴백 (DB에 옛 타입이 남아 있을 때)
export interface StatMeta {
  label: string;
  unit: string;
  icon: string;
  lowerIsBetter?: boolean;
}

export const STAT_TYPE_LABEL_FALLBACK: Record<string, StatMeta> = {
  sprint_30m:       { label: "30m 달리기",           unit: "초",   icon: "🏃",  lowerIsBetter: true  },
  "30m_sprint":     { label: "30m 달리기",           unit: "초",   icon: "🏃",  lowerIsBetter: true  },
  "1000m_run":      { label: "1000m 달리기",         unit: "분:초", icon: "🏃‍♂️", lowerIsBetter: true  },
  shooting_accuracy:{ label: "슈팅 정확도",           unit: "개",   icon: "📊",  lowerIsBetter: false },
  // 제거된 항목 — 기존 DB 데이터 표시용
  shuttle_run:      { label: "왕복달리기",            unit: "회",   icon: "🔄",  lowerIsBetter: false },
  standing_jump:    { label: "제자리멀리뛰기",         unit: "cm",   icon: "🦘",  lowerIsBetter: false },
  sit_ups:          { label: "윗몸일으키기",           unit: "회",   icon: "💪",  lowerIsBetter: false },
  flexibility:      { label: "앉아윗몸앞으로굽히기",   unit: "cm",   icon: "🧘",  lowerIsBetter: false },
};

export function getStatMeta(statType: string): StatMeta {
  const m = MEASUREMENTS.find((m) => m.id === statType);
  if (m) return m;
  return STAT_TYPE_LABEL_FALLBACK[statType] ?? { label: statType, unit: "", icon: "📊" };
}

export const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
  sprint_50m:   { min: 5.5, max: 12  },
  juggling:     { min: 1,   max: 5000 },
  kick_power:   { min: 20,  max: 150  },
  run_1000m:    { min: 180, max: 600  },
  push_ups:     { min: 1,   max: 100  },
  sargent_jump: { min: 10,  max: 90   },
} as const;

// 연령별 스탯 범위 (어뷰징 방지)
// age group key: "u10" = ~9세, "u12" = 10~11세, "u15" = 12~14세, "u18" = 15~17세, "adult" = 18+
export type AgeGroup = "u10" | "u12" | "u15" | "u18" | "adult";

export const AGE_STAT_BOUNDS: Record<string, Record<AgeGroup, { min: number; max: number; warn: number }>> = {
  sprint_50m: {
    u10:   { min: 6.5, max: 15,  warn: 7.5  },
    u12:   { min: 6.0, max: 15,  warn: 7.0  },
    u15:   { min: 5.5, max: 15,  warn: 6.5  },
    u18:   { min: 5.0, max: 15,  warn: 6.0  },
    adult: { min: 5.0, max: 15,  warn: 5.5  },
  },
  juggling: {
    u10:   { min: 1, max: 3000,  warn: 500   },
    u12:   { min: 1, max: 5000,  warn: 1000  },
    u15:   { min: 1, max: 10000, warn: 3000  },
    u18:   { min: 1, max: 15000, warn: 5000  },
    adult: { min: 1, max: 20000, warn: 10000 },
  },
  kick_power: {
    u10:   { min: 10, max: 80,  warn: 50  },
    u12:   { min: 10, max: 100, warn: 70  },
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
  push_ups: {
    u10:   { min: 1, max: 50,  warn: 30 },
    u12:   { min: 1, max: 60,  warn: 38 },
    u15:   { min: 1, max: 75,  warn: 50 },
    u18:   { min: 1, max: 90,  warn: 60 },
    adult: { min: 1, max: 100, warn: 70 },
  },
  sargent_jump: {
    u10:   { min: 10, max: 50, warn: 42 },
    u12:   { min: 10, max: 58, warn: 50 },
    u15:   { min: 15, max: 72, warn: 62 },
    u18:   { min: 20, max: 85, warn: 72 },
    adult: { min: 20, max: 90, warn: 78 },
  },
} as const;

// 연령대별 참고 기준값 (현장 기반 추정치 — "참고 기준"으로만 사용)
export const MEASUREMENT_BENCHMARKS: Record<
  string,
  Record<AgeGroup, { avg: number; top25: number }>
> = {
  sprint_50m:   { u10: { avg: 9.5, top25: 8.8 }, u12: { avg: 8.5, top25: 7.8 }, u15: { avg: 7.5, top25: 6.9 }, u18: { avg: 6.8, top25: 6.3 }, adult: { avg: 6.4, top25: 5.9 } },
  juggling:     { u10: { avg: 15,  top25: 40  }, u12: { avg: 50,  top25: 150  }, u15: { avg: 100, top25: 300  }, u18: { avg: 200, top25: 500  }, adult: { avg: 300, top25: 800  } },
  kick_power:   { u10: { avg: 45,  top25: 55  }, u12: { avg: 60,  top25: 72   }, u15: { avg: 78,  top25: 90   }, u18: { avg: 95,  top25: 110  }, adult: { avg: 105, top25: 120  } },
  run_1000m:    { u10: { avg: 330, top25: 290 }, u12: { avg: 285, top25: 250  }, u15: { avg: 240, top25: 215  }, u18: { avg: 220, top25: 195  }, adult: { avg: 210, top25: 185  } },
  push_ups:     { u10: { avg: 15,  top25: 25  }, u12: { avg: 20,  top25: 30   }, u15: { avg: 28,  top25: 40   }, u18: { avg: 35,  top25: 50   }, adult: { avg: 45,  top25: 60   } },
  sargent_jump: { u10: { avg: 25,  top25: 35  }, u12: { avg: 30,  top25: 40   }, u15: { avg: 42,  top25: 55   }, u18: { avg: 52,  top25: 65   }, adult: { avg: 58,  top25: 72   } },
};

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

// 체력 레이더 6축 (순수 측정 기반)
export const RADAR_STATS = [
  { id: "speed",       label: "속도",      shortLabel: "속도",    icon: "⚡",   color: "#4ADE80", statType: "sprint_50m",   lowerIsBetter: true  },
  { id: "endurance",   label: "지구력",    shortLabel: "지구력",  icon: "🏃‍♂️", color: "#60A5FA", statType: "run_1000m",    lowerIsBetter: true  },
  { id: "agility",     label: "폭발력",    shortLabel: "폭발력",  icon: "🦘",   color: "#A78BFA", statType: "sargent_jump", lowerIsBetter: false },
  { id: "power",       label: "근력",      shortLabel: "근력",    icon: "💪",   color: "#F87171", statType: "push_ups",     lowerIsBetter: false },
  { id: "flexibility", label: "킥력",      shortLabel: "킥력",    icon: "🦵",   color: "#F472B6", statType: "kick_power",   lowerIsBetter: false },
  { id: "control",     label: "볼컨트롤",  shortLabel: "컨트롤",  icon: "⚽",   color: "#FBBF24", statType: "juggling",     lowerIsBetter: false },
] as const;

export type RadarStatId = (typeof RADAR_STATS)[number]["id"];

// ── 플레이 스타일 시스템 ──

export type PlayStyleType =
  | "aggressive_dribbler"
  | "game_maker"
  | "goal_scorer"
  | "box_to_box"
  | "defensive_warrior"
  | "speedster"
  | "controller"
  | "all_rounder";

export const PLAY_STYLES: Record<PlayStyleType, {
  label: string;
  icon: string;
  description: string;
}> = {
  aggressive_dribbler: { label: "공격형 드리블러", icon: "⚡", description: "공을 잡으면 돌파부터" },
  game_maker:          { label: "게임메이커", icon: "🎯", description: "패스 한 번으로 판을 바꾼다" },
  goal_scorer:         { label: "골잡이", icon: "🔥", description: "골 앞에서 가장 빛난다" },
  box_to_box:          { label: "박스투박스", icon: "🔋", description: "공격도 수비도 내 몫" },
  defensive_warrior:   { label: "수비형 전사", icon: "🛡️", description: "상대를 절대 못 지나가게" },
  speedster:           { label: "스피드스터", icon: "💨", description: "빈 공간이 보이면 달린다" },
  controller:          { label: "컨트롤러", icon: "🧤", description: "공은 내 발에 붙어있다" },
  all_rounder:         { label: "올라운더", icon: "⭐", description: "못하는 게 없다" },
};

export const STYLE_TRAIT_LABELS = {
  breakthrough: "돌파",
  creativity: "창의",
  finishing: "결정",
  tenacity: "투지",
} as const;

export type StyleTraitKey = keyof typeof STYLE_TRAIT_LABELS;

export interface StyleQuestion {
  question: string;
  answers: { text: string; scores: Partial<Record<StyleTraitKey, number>> }[];
}

export const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    question: "우리 팀이 상대 진영에서 공을 뺏었다. 나는?",
    answers: [
      { text: "바로 공을 달라고 소리친다", scores: { breakthrough: 3, finishing: 1 } },
      { text: "빈 공간으로 달려간다", scores: { finishing: 2, tenacity: 1 } },
      { text: "좋은 위치의 동료를 찾아본다", scores: { creativity: 3 } },
      { text: "뒤를 봐주며 안전하게", scores: { tenacity: 3 } },
    ],
  },
  {
    question: "1대1 상황. 상대 수비수가 앞에 있다.",
    answers: [
      { text: "페인트 넣고 돌파한다", scores: { breakthrough: 3, creativity: 1 } },
      { text: "슛이 가능하면 바로 슛", scores: { finishing: 3 } },
      { text: "동료에게 벽패스를 시도한다", scores: { creativity: 3, breakthrough: 1 } },
      { text: "공을 지키며 지원을 기다린다", scores: { tenacity: 2, creativity: 1 } },
    ],
  },
  {
    question: "경기 중 내가 가장 신나는 순간은?",
    answers: [
      { text: "상대를 제치고 돌파할 때", scores: { breakthrough: 3 } },
      { text: "골을 넣었을 때", scores: { finishing: 3 } },
      { text: "내 패스로 동료가 골 넣었을 때", scores: { creativity: 3 } },
      { text: "상대의 결정적 공격을 막았을 때", scores: { tenacity: 3 } },
    ],
  },
  {
    question: "우리 팀이 1점 지고 있다. 후반 10분.",
    answers: [
      { text: "최전방으로 올라가서 찬스를 만든다", scores: { finishing: 2, breakthrough: 2 } },
      { text: "중앙에서 템포를 올려 동료들을 움직인다", scores: { creativity: 3, tenacity: 1 } },
      { text: "공을 잡으면 무조건 상대를 돌파한다", scores: { breakthrough: 3, finishing: 1 } },
      { text: "내 위치를 지키면서 균형을 맞춘다", scores: { tenacity: 3, creativity: 1 } },
    ],
  },
  {
    question: "코치님이 나에게 기대하는 건?",
    answers: [
      { text: "드리블로 상대를 뚫는 것", scores: { breakthrough: 3 } },
      { text: "골을 넣는 것", scores: { finishing: 3 } },
      { text: "동료를 살리는 패스", scores: { creativity: 3 } },
      { text: "끝까지 뛰며 수비하는 것", scores: { tenacity: 3 } },
    ],
  },
];

/** 특성 점수로 스타일 타입 결정 */
export function determinePlayStyle(traits: Record<StyleTraitKey, number>): PlayStyleType {
  const entries = Object.entries(traits) as [StyleTraitKey, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  // 편차 체크: 올라운더
  const values = entries.map(([, v]) => v);
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max - min < 3) return "all_rounder";

  const [first] = sorted[0];
  const [second] = sorted[1];

  if (first === "breakthrough" && second === "creativity") return "aggressive_dribbler";
  if (first === "breakthrough" && second === "tenacity") return "speedster";
  if (first === "breakthrough" && second === "finishing") return "aggressive_dribbler";
  if (first === "creativity" && second === "breakthrough") return "game_maker";
  if (first === "creativity" && second === "finishing") return "game_maker";
  if (first === "creativity" && second === "tenacity") return "controller";
  if (first === "finishing" && second === "breakthrough") return "goal_scorer";
  if (first === "finishing" && second === "creativity") return "goal_scorer";
  if (first === "finishing" && second === "tenacity") return "goal_scorer";
  if (first === "tenacity" && second === "creativity") return "box_to_box";
  if (first === "tenacity" && second === "breakthrough") return "defensive_warrior";
  if (first === "tenacity" && second === "finishing") return "defensive_warrior";

  return "all_rounder";
}
