export type EventTag = "goal" | "assist" | "dribble" | "save" | "other";

export interface ClipSegment {
  id: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  eventTag: EventTag;
}

export const EVENT_TAG_LABELS: Record<EventTag, string> = {
  goal:    "⚽ 골",
  assist:  "🎯 어시스트",
  dribble: "🏃 드리블",
  save:    "🧤 세이브",
  other:   "✨ 기타",
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
