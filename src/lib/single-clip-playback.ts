import type { HighlightSuggestionDraft } from "@/lib/highlight-suggestion";
import { getDraftHeroCut } from "@/lib/highlight-suggestion";
import { DEFAULT_FOCUS_ZOOM } from "@/lib/focus-zoom";
import type { PlaybackEffects } from "@/lib/playback-focus";
import type { SpotlightCoord } from "@/lib/spotlight-math";

export interface SingleClipPlaybackContract {
  id: string;
  profileId?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  highlightStart?: number | null;
  highlightEnd?: number | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  slowmoStart?: number | null;
  slowmoEnd?: number | null;
  slowmoSpeed?: number | null;
  bgmId?: string | null;
  effects?: PlaybackEffects | null;
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
}

export interface SingleClipPlaybackRow {
  id: string;
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  duration_sec?: number | null;
  trim_start?: number | null;
  trim_end?: number | null;
  highlight_start?: number | null;
  highlight_end?: number | null;
  spotlight_x?: number | null;
  spotlight_y?: number | null;
  freeze_at?: number | null;
  slowmo_start?: number | null;
  slowmo_end?: number | null;
  slowmo_speed?: number | null;
  bgm_id?: string | null;
  effects?: PlaybackEffects | null;
}

export interface ResolvedSingleClipPlaybackWindow {
  trimStartSec: number;
  trimEndSec: number;
  durationSec: number;
}

export interface ResolvedSingleClipFreezePoint {
  freezeAtSec: number | null;
  isAdjustedFromImmediate: boolean;
}

export interface DraftSingleClipPlaybackContract {
  trimStart: number;
  trimEnd: number;
  duration: number;
  highlightStart: number;
  highlightEnd: number;
}

export type SingleClipProfileTarget = "featured_candidate" | "tag_portfolio";

export interface SingleClipEditingDraft {
  projectId: string | null;
  projectStatus: "draft" | "published";
  clipId: string;
  sourceDurationSec: number;
  playback: {
    trimStart: number;
    trimEnd: number;
    highlightStart: number;
    highlightEnd: number;
    spotlight: SpotlightCoord | null;
    freezeAt: number | null;
    zoom: number;
    trackingMode: "fixed";
    trackingPoints: [];
  };
  overlay: {
    showProfileCard: boolean;
    showLowerThird: boolean;
  };
  saveTarget: {
    profileTarget: SingleClipProfileTarget;
    portfolioTagName: string | null;
  };
  lastEditedAt: string | null;
  lastSavedAt: string | null;
}

function roundToTenths(value: number) {
  return Number(value.toFixed(1));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRange(start: number, end: number, min: number, max: number) {
  const nextStart = clampNumber(start, min, max);
  const nextEnd = clampNumber(end, nextStart, max);

  return {
    start: roundToTenths(nextStart),
    end: roundToTenths(nextEnd),
  };
}

export function createSingleClipEditingDraft({
  clipId,
  sourceDurationSec,
  trimStart = 0,
  trimEnd,
  highlightStart,
  highlightEnd,
  spotlight,
  freezeAt,
  zoom = DEFAULT_FOCUS_ZOOM,
  showProfileCard = true,
  showLowerThird = true,
}: {
  clipId: string;
  sourceDurationSec: number;
  trimStart?: number;
  trimEnd?: number | null;
  highlightStart?: number | null;
  highlightEnd?: number | null;
  spotlight?: SpotlightCoord | null;
  freezeAt?: number | null;
  zoom?: number;
  showProfileCard?: boolean;
  showLowerThird?: boolean;
}): SingleClipEditingDraft {
  const safeDuration = Math.max(roundToTenths(sourceDurationSec), 0.1);
  const normalizedTrim = normalizeRange(trimStart, trimEnd ?? safeDuration, 0, safeDuration);
  const normalizedHighlight = normalizeRange(
    highlightStart ?? normalizedTrim.start,
    highlightEnd ?? normalizedTrim.end,
    normalizedTrim.start,
    normalizedTrim.end,
  );

  return {
    projectId: null,
    projectStatus: "draft",
    clipId,
    sourceDurationSec: safeDuration,
    playback: {
      trimStart: normalizedTrim.start,
      trimEnd: normalizedTrim.end,
      highlightStart: normalizedHighlight.start,
      highlightEnd: normalizedHighlight.end,
      spotlight: spotlight ?? null,
      freezeAt: freezeAt != null ? clampNumber(roundToTenths(freezeAt), normalizedTrim.start, normalizedTrim.end) : null,
      zoom: roundToTenths(Math.max(1, zoom)),
      trackingMode: "fixed",
      trackingPoints: [],
    },
    overlay: {
      showProfileCard,
      showLowerThird,
    },
    saveTarget: {
      profileTarget: "featured_candidate",
      portfolioTagName: null,
    },
    lastEditedAt: null,
    lastSavedAt: null,
  };
}

export function resolveSingleClipEditingDraft(draft: SingleClipEditingDraft): SingleClipEditingDraft {
  const safeDuration = Math.max(roundToTenths(draft.sourceDurationSec), 0.1);
  const normalizedTrim = normalizeRange(
    draft.playback.trimStart,
    draft.playback.trimEnd,
    0,
    safeDuration,
  );
  const normalizedHighlight = normalizeRange(
    draft.playback.highlightStart,
    draft.playback.highlightEnd,
    normalizedTrim.start,
    normalizedTrim.end,
  );

  return {
    ...draft,
    sourceDurationSec: safeDuration,
    playback: {
      ...draft.playback,
      trimStart: normalizedTrim.start,
      trimEnd: normalizedTrim.end,
      highlightStart: normalizedHighlight.start,
      highlightEnd: normalizedHighlight.end,
      freezeAt: draft.playback.freezeAt != null
        ? clampNumber(roundToTenths(draft.playback.freezeAt), normalizedTrim.start, normalizedTrim.end)
        : null,
      zoom: roundToTenths(Math.max(1, draft.playback.zoom)),
      trackingMode: "fixed",
      trackingPoints: [],
    },
    overlay: {
      ...draft.overlay,
      showProfileCard: draft.overlay.showProfileCard,
    },
  };
}

export function updateSingleClipEditingDraft(
  draft: SingleClipEditingDraft,
  updater: (current: SingleClipEditingDraft) => SingleClipEditingDraft,
  editedAt = new Date().toISOString(),
): SingleClipEditingDraft {
  const nextDraft = resolveSingleClipEditingDraft(updater(draft));
  return {
    ...nextDraft,
    lastEditedAt: editedAt,
  };
}

export function markSingleClipDraftSaved(
  draft: SingleClipEditingDraft,
  savedAt = new Date().toISOString(),
): SingleClipEditingDraft {
  return {
    ...draft,
    lastSavedAt: savedAt,
  };
}

export function markSingleClipDraftPersisted(
  draft: SingleClipEditingDraft,
  {
    projectId,
    projectStatus = "draft",
    savedAt = new Date().toISOString(),
  }: {
    projectId: string;
    projectStatus?: "draft" | "published";
    savedAt?: string;
  },
): SingleClipEditingDraft {
  return {
    ...draft,
    projectId,
    projectStatus,
    lastSavedAt: savedAt,
  };
}

export function resolveSingleClipEditingPatch(draft: SingleClipEditingDraft) {
  const normalizedDraft = resolveSingleClipEditingDraft(draft);

  return {
    highlight_start: normalizedDraft.playback.highlightStart,
    highlight_end: normalizedDraft.playback.highlightEnd,
    trim_start: normalizedDraft.playback.trimStart,
    trim_end: normalizedDraft.playback.trimEnd,
    duration_sec: roundToTenths(normalizedDraft.playback.trimEnd - normalizedDraft.playback.trimStart),
    spotlight_x: normalizedDraft.playback.spotlight?.x ?? null,
    spotlight_y: normalizedDraft.playback.spotlight?.y ?? null,
    freeze_at: normalizedDraft.playback.spotlight ? normalizedDraft.playback.freezeAt : null,
    effects: {
      intro: normalizedDraft.overlay.showProfileCard,
      showLowerThird: normalizedDraft.overlay.showLowerThird,
      focusZoom: normalizedDraft.playback.zoom,
      trackingMode: normalizedDraft.playback.trackingMode,
      trackingPoints: normalizedDraft.playback.trackingPoints,
    } satisfies PlaybackEffects,
  };
}

export function resolveSingleClipPlaybackWindow(
  clip: Pick<SingleClipPlaybackContract, "duration" | "trimStart" | "trimEnd">,
  fallbackDurationSec?: number | null,
): ResolvedSingleClipPlaybackWindow {
  const trimStartSec = Math.max(0, clip.trimStart ?? 0);
  const sourceDurationSec = Number.isFinite(fallbackDurationSec)
    ? Number(fallbackDurationSec)
    : Number.isFinite(clip.duration)
      ? Number(clip.duration)
      : 0;
  const trimEndCandidate = clip.trimEnd ?? sourceDurationSec;
  const trimEndSec = Math.max(trimStartSec, trimEndCandidate);

  return {
    trimStartSec,
    trimEndSec,
    durationSec: Math.max(0, trimEndSec - trimStartSec),
  };
}

export function resolveSingleClipFreezePoint(
  clip: Pick<SingleClipPlaybackContract, "duration" | "trimStart" | "trimEnd" | "freezeAt">,
  fallbackDurationSec?: number | null,
): ResolvedSingleClipFreezePoint {
  const { trimStartSec, trimEndSec, durationSec } = resolveSingleClipPlaybackWindow(clip, fallbackDurationSec);
  if (clip.freezeAt == null || !Number.isFinite(clip.freezeAt)) {
    return { freezeAtSec: null, isAdjustedFromImmediate: false };
  }

  const clampedFreezeAt = clampNumber(Number(clip.freezeAt), trimStartSec, trimEndSec);
  if (durationSec <= 0.6) {
    return {
      freezeAtSec: clampedFreezeAt,
      isAdjustedFromImmediate: false,
    };
  }

  const immediateThreshold = trimStartSec + 0.05;
  if (clampedFreezeAt > immediateThreshold) {
    return {
      freezeAtSec: clampedFreezeAt,
      isAdjustedFromImmediate: false,
    };
  }

  const bufferedFreezeAt = Math.min(
    trimEndSec - 0.2,
    trimStartSec + (durationSec >= 1.2 ? 0.8 : Math.max(durationSec * 0.5, 0.2)),
  );

  return {
    freezeAtSec: roundToTenths(Math.max(trimStartSec, bufferedFreezeAt)),
    isAdjustedFromImmediate: true,
  };
}

export function resolveSingleClipPlayableDuration(clip: Pick<SingleClipPlaybackRow, "duration_seconds" | "duration_sec" | "trim_start" | "trim_end">) {
  if (clip.trim_start != null && clip.trim_end != null && clip.trim_end >= clip.trim_start) {
    return Math.max(0, clip.trim_end - clip.trim_start);
  }

  if (clip.duration_sec != null) return Math.max(0, clip.duration_sec);
  return Math.max(0, clip.duration_seconds ?? 0);
}

export function buildSingleClipPlaybackContract(
  clip: SingleClipPlaybackRow,
  overrides: Omit<Partial<SingleClipPlaybackContract>, keyof SingleClipPlaybackContract> & Partial<SingleClipPlaybackContract> = {},
): SingleClipPlaybackContract {
  return {
    id: clip.id,
    videoUrl: clip.video_url,
    thumbnailUrl: clip.thumbnail_url ?? null,
    duration: resolveSingleClipPlayableDuration(clip),
    trimStart: clip.trim_start ?? null,
    trimEnd: clip.trim_end ?? null,
    highlightStart: clip.highlight_start ?? null,
    highlightEnd: clip.highlight_end ?? null,
    spotlightX: clip.spotlight_x ?? null,
    spotlightY: clip.spotlight_y ?? null,
    freezeAt: clip.freeze_at ?? null,
    slowmoStart: clip.slowmo_start ?? null,
    slowmoEnd: clip.slowmo_end ?? null,
    slowmoSpeed: clip.slowmo_speed ?? null,
    bgmId: clip.bgm_id ?? null,
    effects: clip.effects ?? null,
    ...overrides,
  };
}

export function resolveDraftSingleClipPlayback(
  draft: HighlightSuggestionDraft,
): DraftSingleClipPlaybackContract {
  const heroCut = getDraftHeroCut(draft);
  if (!heroCut) {
    throw new Error("저장할 대표 컷이 없습니다.");
  }

  const trimStart = roundToTenths(heroCut.startMs / 1000);
  const trimEnd = roundToTenths(heroCut.endMs / 1000);

  return {
    trimStart,
    trimEnd,
    duration: roundToTenths((heroCut.endMs - heroCut.startMs) / 1000),
    highlightStart: Math.max(0, Math.round(heroCut.startMs / 1000)),
    highlightEnd: Math.max(0, Math.round(heroCut.endMs / 1000)),
  };
}
