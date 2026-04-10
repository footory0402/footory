import { createSingleClipEditingDraft, type SingleClipEditingDraft } from "@/lib/single-clip-playback";

interface SingleClipDraftSource {
  clipId: string | null;
  duration: number | null;
  trimStart: number;
  trimEnd: number | null;
  spotlightX: number | null;
  spotlightY: number | null;
  freezeAt: number | null;
  effects: {
    focusZoom: number;
    showLowerThird: boolean;
  };
}

interface UploadStoreDraftWriter {
  setClipId: (id: string) => void;
  setDuration: (duration: number | null) => void;
  setTrimStart: (trimStart: number) => void;
  setTrimEnd: (trimEnd: number | null) => void;
  setSpotlight: (x: number | null, y: number | null) => void;
  setFreezeAt: (freezeAt: number | null) => void;
  setEffects: (effects: { intro?: boolean; showLowerThird?: boolean; focusZoom?: number }) => void;
  setTags: (tags: string[]) => void;
  setEditorDraft: (draft: SingleClipEditingDraft | null) => void;
  setStatus: (status: "idle") => void;
  setError: (error: string | null) => void;
  setProgress: (progress: number) => void;
  setPhase: (phase: "review") => void;
}

export function createSingleClipDraftFromStoreSource(
  source: SingleClipDraftSource,
): SingleClipEditingDraft | null {
  if (!source.clipId) return null;
  const sourceDurationSec = source.duration ?? 0;

  return createSingleClipEditingDraft({
    clipId: source.clipId,
    sourceDurationSec,
    trimStart: source.trimStart,
    trimEnd: source.trimEnd ?? sourceDurationSec,
    spotlight:
      source.spotlightX != null && source.spotlightY != null
        ? { x: source.spotlightX, y: source.spotlightY }
        : null,
    freezeAt: source.freezeAt,
    zoom: source.effects.focusZoom,
    showProfileCard: true,
    showLowerThird: source.effects.showLowerThird,
  });
}

export function applySingleClipDraftToUploadStore({
  store,
  draft,
  clipId,
  durationSec,
  tags,
}: {
  store: UploadStoreDraftWriter;
  draft: SingleClipEditingDraft;
  clipId: string;
  durationSec: number;
  tags: string[];
}) {
  store.setClipId(clipId);
  store.setDuration(durationSec);
  store.setTrimStart(draft.playback.trimStart);
  store.setTrimEnd(draft.playback.trimEnd);
  store.setSpotlight(draft.playback.spotlight?.x ?? null, draft.playback.spotlight?.y ?? null);
  store.setFreezeAt(draft.playback.freezeAt);
  store.setEffects({
    intro: draft.overlay.showProfileCard,
    showLowerThird: draft.overlay.showLowerThird,
    focusZoom: draft.playback.zoom,
  });
  store.setTags(tags);
  store.setEditorDraft(draft);
  store.setStatus("idle");
  store.setError(null);
  store.setProgress(0);
  store.setPhase("review");
}
