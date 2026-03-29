export type EventTag = "goal" | "assist" | "dribble" | "save" | "other";

export interface ClipSegment {
  id: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  eventTag: EventTag;
  /** "여기!" 클릭 시점 (초) */
  markedAt?: number;
  /** 클립별 선수 스포트라이트 위치 (0-1 normalized) */
  spotlightX?: number;
  spotlightY?: number;
  /** EA FC 다이아몬드 마커 X 위치 (0-1 normalized) */
  markerX?: number;
  /** EA FC 다이아몬드 마커 Y 위치 (0-1 normalized) */
  markerY?: number;
  /** 프리즈 프레임 시점 (영상 절대 시간, 초) */
  freezeAt?: number;
}

export interface EventDef {
  id: EventTag;
  label: string;
  emoji: string;
}

export const EVENTS: EventDef[] = [
  { id: "goal",    label: "골",       emoji: "⚽" },
  { id: "assist",  label: "어시스트", emoji: "🅰️" },
  { id: "dribble", label: "드리블",   emoji: "💨" },
  { id: "save",    label: "세이브",   emoji: "🧤" },
  { id: "other",   label: "기타",     emoji: "⭐" },
];

export const EVENT_TAG_LABELS: Record<EventTag, string> = {
  goal:    "⚽ 골",
  assist:  "🅰️ 어시스트",
  dribble: "💨 드리블",
  save:    "🧤 세이브",
  other:   "⭐ 기타",
};

export const EVENT_TAG_COLORS: Record<EventTag, string> = {
  goal:    "#D4A853",
  assist:  "#3B82F6",
  dribble: "#10B981",
  save:    "#8B5CF6",
  other:   "#6B7280",
};

export const DEFAULT_CLIP_DURATION = 10; // seconds
export const MAX_CLIPS = 10;
export const MIN_CLIP_DURATION = 3;      // seconds
