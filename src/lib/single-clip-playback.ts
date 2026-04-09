import type { HighlightSuggestionDraft } from "@/lib/highlight-suggestion";
import { getDraftHeroCut } from "@/lib/highlight-suggestion";
import { DEFAULT_FOCUS_ZOOM } from "@/lib/focus-zoom";
import type { PlaybackEffects } from "@/lib/playback-focus";
import type { SpotlightCoord } from "@/lib/spotlight-math";

export interface SingleClipPlaybackContract {
  id: string;
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

export interface ResolvedSingleClipPlaybackWindow {
  trimStartSec: number;
  trimEndSec: number;
  durationSec: number;
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
  showProfileCard = false,
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
