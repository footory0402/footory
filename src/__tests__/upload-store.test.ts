import { describe, it, expect, beforeEach } from "vitest";
import { useUploadStore } from "@/stores/upload-store";

describe("Upload Store v3.0", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useUploadStore.getState();
    expect(state.phase).toBe("select");
    expect(state.editorDraft).toBeNull();
    expect(state.eventTag).toBeNull();
    expect(state.trimStart).toBe(0);
    expect(state.trimEnd).toBeNull();
    expect(state.spotlightX).toBeNull();
    expect(state.spotlightY).toBeNull();
    expect(state.skillLabels).toEqual([]);
    expect(state.customLabels).toEqual([]);
    expect(state.effects).toEqual({
      color: false,
      cinematic: false,
      eafc: false,
      intro: false,
      showLowerThird: true,
      focusZoom: 1.8,
    });
    expect(state.renderJobId).toBeNull();
  });

  it("sets phase correctly", () => {
    const store = useUploadStore.getState();
    store.setPhase("processing");
    expect(useUploadStore.getState().phase).toBe("processing");
  });

  it("sets eventTag correctly", () => {
    const store = useUploadStore.getState();
    store.setEventTag("goal");
    expect(useUploadStore.getState().eventTag).toBe("goal");
  });

  it("sets trim values", () => {
    const store = useUploadStore.getState();
    store.setTrimStart(5.2);
    store.setTrimEnd(25.8);
    const state = useUploadStore.getState();
    expect(state.trimStart).toBe(5.2);
    expect(state.trimEnd).toBe(25.8);
  });

  it("sets spotlight coordinates", () => {
    const store = useUploadStore.getState();
    store.setSpotlight(0.35, 0.72);
    const state = useUploadStore.getState();
    expect(state.spotlightX).toBe(0.35);
    expect(state.spotlightY).toBe(0.72);
  });

  it("clears spotlight", () => {
    const store = useUploadStore.getState();
    store.setSpotlight(0.5, 0.5);
    store.setSpotlight(null, null);
    const state = useUploadStore.getState();
    expect(state.spotlightX).toBeNull();
    expect(state.spotlightY).toBeNull();
  });

  it("sets skill labels", () => {
    const store = useUploadStore.getState();
    store.setSkillLabels(["dribble", "shooting", "speed"]);
    expect(useUploadStore.getState().skillLabels).toEqual([
      "dribble",
      "shooting",
      "speed",
    ]);
  });

  it("sets effects partially", () => {
    const store = useUploadStore.getState();
    store.setEffects({ color: true, intro: true });
    const state = useUploadStore.getState();
    expect(state.effects).toEqual({
      color: true,
      cinematic: false,
      eafc: false,
      intro: true,
      showLowerThird: true,
      focusZoom: 1.8,
    });
  });

  it("has new status types", () => {
    const store = useUploadStore.getState();
    store.setStatus("editing");
    expect(useUploadStore.getState().status).toBe("editing");
    store.setStatus("uploading_raw");
    expect(useUploadStore.getState().status).toBe("uploading_raw");
    store.setStatus("analyzing");
    expect(useUploadStore.getState().status).toBe("analyzing");
  });

  it("reset clears all fields", () => {
    const store = useUploadStore.getState();
    store.setPhase("review");
    store.setEventTag("goal");
    store.setTrimStart(10);
    store.setSpotlight(0.5, 0.5);
    store.setSkillLabels(["dribble"]);
    store.setEffects({ color: true });
    store.setRenderJobId("job-1");
    store.setEditorDraft({
      projectId: null,
      projectStatus: "draft",
      clipId: "clip-test",
      sourceDurationSec: 10,
      playback: {
        trimStart: 0,
        trimEnd: 10,
        highlightStart: 0,
        highlightEnd: 10,
        spotlight: null,
        freezeAt: null,
        zoom: 1.8,
        trackingMode: "fixed",
        trackingPoints: [],
      },
      overlay: {
        showProfileCard: false,
        showLowerThird: true,
      },
      saveTarget: {
        profileTarget: "featured_candidate",
        portfolioTagName: null,
      },
      lastEditedAt: null,
      lastSavedAt: null,
    });

    store.reset();

    const state = useUploadStore.getState();
    expect(state.phase).toBe("select");
    expect(state.editorDraft).toBeNull();
    expect(state.eventTag).toBeNull();
    expect(state.trimStart).toBe(0);
    expect(state.spotlightX).toBeNull();
    expect(state.skillLabels).toEqual([]);
    expect(state.effects.color).toBe(false);
    expect(state.renderJobId).toBeNull();
  });
});
