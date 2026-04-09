export type HighlightSuggestionReason =
  | "opening_window"
  | "key_action_window"
  | "supporting_window"
  | "closing_window";

export interface HighlightSuggestedCut {
  id: string;
  order: number;
  label: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  confidence: number;
  reason: HighlightSuggestionReason;
  isHeroCandidate: boolean;
}

export type HighlightProfileTarget = "featured_candidate" | "tag_portfolio";

export interface HighlightSuggestionDraft {
  projectId: string;
  mediaId: string;
  sourceClipId: string;
  sourceDurationMs: number;
  status: "analysis_ready";
  generatedAt: string;
  analysis: {
    version: string;
    suggestedCuts: HighlightSuggestedCut[];
    suggestedHeroCutId: string;
  };
  editDecision: {
    confirmedCuts: HighlightSuggestedCut[];
    heroCutId: string;
    overlay: {
      name: string | null;
      number: string | null;
      position: string | null;
    };
    lastEditedAt: string | null;
  };
  outputs: {
    previewThumbnailUrl: string | null;
    renderedVideoUrl: string | null;
  };
  profileTarget: HighlightProfileTarget;
  portfolioTagName: string | null;
  lastSavedAt: string | null;
}

interface CreateHighlightSuggestionDraftParams {
  clipId: string;
  mediaId?: string | null;
  durationSec: number;
  trimStartSec?: number;
  trimEndSec?: number | null;
  generatedAt?: string;
  overlayDefaults?: {
    name?: string | null;
    number?: string | null;
    position?: string | null;
  };
}

const MIN_CUT_MS = 4_000;
const MAX_CUT_MS = 12_000;
const MIN_RANGE_MS = 1_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveCutCount(rangeMs: number) {
  if (rangeMs <= 15_000) return 1;
  if (rangeMs <= 35_000) return 2;
  if (rangeMs <= 75_000) return 3;
  return 4;
}

function resolveReason(index: number, count: number): HighlightSuggestionReason {
  if (count === 1) return "key_action_window";
  if (index === 0) return "opening_window";
  if (index === count - 1) return "closing_window";
  if (index === Math.floor(count / 2)) return "key_action_window";
  return "supporting_window";
}

function resolveLabel(index: number, count: number, reason: HighlightSuggestionReason) {
  if (count === 1) return "대표 장면 후보";
  switch (reason) {
    case "opening_window":
      return "초반 장면";
    case "closing_window":
      return "마무리 장면";
    case "key_action_window":
      return "핵심 장면";
    default:
      return `보조 장면 ${index + 1}`;
  }
}

function roundToHundreds(value: number) {
  return Math.round(value / 100) * 100;
}

export function createHighlightSuggestionDraft({
  clipId,
  mediaId,
  durationSec,
  trimStartSec = 0,
  trimEndSec,
  generatedAt = new Date().toISOString(),
  overlayDefaults,
}: CreateHighlightSuggestionDraftParams): HighlightSuggestionDraft {
  const sourceDurationMs = Math.max(MIN_RANGE_MS, roundToHundreds(durationSec * 1000));
  const rangeStartMs = clamp(roundToHundreds(trimStartSec * 1000), 0, sourceDurationMs - MIN_RANGE_MS);
  const requestedEndMs = trimEndSec != null ? roundToHundreds(trimEndSec * 1000) : sourceDurationMs;
  const rangeEndMs = clamp(requestedEndMs, rangeStartMs + MIN_RANGE_MS, sourceDurationMs);
  const rangeMs = Math.max(MIN_RANGE_MS, rangeEndMs - rangeStartMs);
  const cutCount = resolveCutCount(rangeMs);
  const cutDurationMs = clamp(Math.round(rangeMs / (cutCount + 0.35)), MIN_CUT_MS, MAX_CUT_MS);
  const heroIndex = cutCount === 1 ? 0 : Math.min(cutCount - 1, Math.floor(cutCount / 2));
  const segmentSize = rangeMs / cutCount;

  const suggestedCuts = Array.from({ length: cutCount }, (_, index) => {
    const segmentStart = rangeStartMs + segmentSize * index;
    const segmentEnd = index === cutCount - 1 ? rangeEndMs : rangeStartMs + segmentSize * (index + 1);
    const segmentCenter = Math.round((segmentStart + segmentEnd) / 2);
    let startMs = clamp(
      roundToHundreds(segmentCenter - cutDurationMs / 2),
      rangeStartMs,
      Math.max(rangeStartMs, rangeEndMs - cutDurationMs),
    );
    let endMs = clamp(startMs + cutDurationMs, startMs + MIN_RANGE_MS, rangeEndMs);

    if (index === cutCount - 1) {
      endMs = rangeEndMs;
      startMs = clamp(endMs - cutDurationMs, rangeStartMs, endMs - MIN_RANGE_MS);
    }

    const reason = resolveReason(index, cutCount);

    return {
      id: `${clipId}-cut-${index + 1}`,
      order: index + 1,
      label: resolveLabel(index, cutCount, reason),
      startMs,
      endMs,
      durationMs: endMs - startMs,
      confidence: Number((0.94 - Math.abs(index - heroIndex) * 0.08).toFixed(2)),
      reason,
      isHeroCandidate: index === heroIndex,
    } satisfies HighlightSuggestedCut;
  });

  const heroCut = suggestedCuts[heroIndex] ?? suggestedCuts[0];
  const projectId = `upload-draft-${clipId}`;

  return {
    projectId,
    mediaId: mediaId ?? clipId,
    sourceClipId: clipId,
    sourceDurationMs,
    status: "analysis_ready",
    generatedAt,
    analysis: {
      version: "slice-1",
      suggestedCuts,
      suggestedHeroCutId: heroCut.id,
    },
    editDecision: {
      confirmedCuts: suggestedCuts.map((cut) => ({ ...cut })),
      heroCutId: heroCut.id,
      overlay: {
        name: overlayDefaults?.name ?? null,
        number: overlayDefaults?.number ?? null,
        position: overlayDefaults?.position ?? null,
      },
      lastEditedAt: null,
    },
    outputs: {
      previewThumbnailUrl: null,
      renderedVideoUrl: null,
    },
    profileTarget: "featured_candidate",
    portfolioTagName: null,
    lastSavedAt: null,
  };
}

function withCutOrdering(
  cuts: HighlightSuggestedCut[],
  heroCutId: string,
) {
  return cuts.map((cut, index) => ({
    ...cut,
    order: index + 1,
    durationMs: Math.max(100, cut.endMs - cut.startMs),
    isHeroCandidate: cut.id === heroCutId,
  }));
}

export function getDraftHeroCut(draft: HighlightSuggestionDraft) {
  return draft.editDecision.confirmedCuts.find((cut) => cut.id === draft.editDecision.heroCutId)
    ?? draft.editDecision.confirmedCuts[0]
    ?? null;
}

export function getDraftTotalDurationMs(draft: HighlightSuggestionDraft) {
  return draft.editDecision.confirmedCuts.reduce((sum, cut) => sum + cut.durationMs, 0);
}

export function updateDraftCutRange(
  draft: HighlightSuggestionDraft,
  cutId: string,
  nextRange: { startMs?: number; endMs?: number },
  editedAt = new Date().toISOString(),
): HighlightSuggestionDraft {
  const confirmedCuts = draft.editDecision.confirmedCuts.map((cut) => {
    if (cut.id !== cutId) return cut;

    const requestedStart = nextRange.startMs ?? cut.startMs;
    const requestedEnd = nextRange.endMs ?? cut.endMs;
    const startMs = Math.max(0, Math.min(requestedStart, requestedEnd - 100));
    const endMs = Math.min(draft.sourceDurationMs, Math.max(requestedEnd, startMs + 100));

    return {
      ...cut,
      startMs,
      endMs,
      durationMs: endMs - startMs,
    };
  });

  return {
    ...draft,
    editDecision: {
      ...draft.editDecision,
      confirmedCuts: withCutOrdering(confirmedCuts, draft.editDecision.heroCutId),
      lastEditedAt: editedAt,
    },
  };
}

export function moveDraftCut(
  draft: HighlightSuggestionDraft,
  cutId: string,
  direction: "up" | "down",
  editedAt = new Date().toISOString(),
): HighlightSuggestionDraft {
  const currentIndex = draft.editDecision.confirmedCuts.findIndex((cut) => cut.id === cutId);
  if (currentIndex === -1) return draft;

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= draft.editDecision.confirmedCuts.length) return draft;

  const reordered = [...draft.editDecision.confirmedCuts];
  const [currentCut] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, currentCut);

  return {
    ...draft,
    editDecision: {
      ...draft.editDecision,
      confirmedCuts: withCutOrdering(reordered, draft.editDecision.heroCutId),
      lastEditedAt: editedAt,
    },
  };
}

export function setDraftHeroCut(
  draft: HighlightSuggestionDraft,
  cutId: string,
  editedAt = new Date().toISOString(),
): HighlightSuggestionDraft {
  const target = draft.editDecision.confirmedCuts.find((cut) => cut.id === cutId);
  if (!target) return draft;

  return {
    ...draft,
    editDecision: {
      ...draft.editDecision,
      heroCutId: cutId,
      confirmedCuts: withCutOrdering(draft.editDecision.confirmedCuts, cutId),
      lastEditedAt: editedAt,
    },
  };
}

export function setDraftProfileTarget(
  draft: HighlightSuggestionDraft,
  profileTarget: HighlightProfileTarget,
  portfolioTagName: string | null,
): HighlightSuggestionDraft {
  return {
    ...draft,
    profileTarget,
    portfolioTagName: profileTarget === "tag_portfolio" ? portfolioTagName : null,
  };
}

export function markDraftSaved(
  draft: HighlightSuggestionDraft,
  savedAt = new Date().toISOString(),
): HighlightSuggestionDraft {
  return {
    ...draft,
    lastSavedAt: savedAt,
  };
}
