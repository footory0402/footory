import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_FOCUS_ZOOM } from "@/lib/focus-zoom";
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
      intro: true,
      showLowerThird: true,
      focusZoom: DEFAULT_FOCUS_ZOOM,
    });
    expect(state.renderJobId).toBeNull();
  });

  it("sets phase correctly", () => {
    const store = useUploadStore.getState();
    store.setPhase("processing");
    expect(useUploadStore.getState().phase).toBe("processing");
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
      focusZoom: DEFAULT_FOCUS_ZOOM,
    });
  });

  it("reset clears clip-flow fields", () => {
    const store = useUploadStore.getState();
    store.setPhase("edit");
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
    expect(state.trimStart).toBe(0);
    expect(state.spotlightX).toBeNull();
    expect(state.skillLabels).toEqual([]);
    expect(state.effects.color).toBe(false);
    expect(state.renderJobId).toBeNull();
  });

  it("setFile resets clip-flow fields but keeps upload context", () => {
    const store = useUploadStore.getState();
    store.setContext("parent");
    store.setChildInfo({ id: "child-1", name: "민준", handle: "minjun" });
    store.setChallengeTag("weekly");
    store.setMemo("memo");
    store.setSkillLabels(["dribble"]);
    store.setCustomLabels(["left-foot"]);
    store.setTrackingMode("follow");
    store.setTrackingPoints([{ time: 1, x: 0.4, y: 0.6 }]);
    store.setSlowmo(1, 2);
    store.setBgm("bgm-1");
    store.setR2Upload("r2-key", "clip-legacy");

    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
    store.setFile(file);

    const state = useUploadStore.getState();
    expect(state.file).toBe(file);
    expect(state.context).toBe("parent");
    expect(state.childId).toBe("child-1");
    expect(state.childName).toBe("민준");
    expect(state.childHandle).toBe("minjun");
    expect(state.challengeTag).toBe("weekly");
    expect(state.memo).toBe("");
    expect(state.skillLabels).toEqual([]);
    expect(state.customLabels).toEqual([]);
    expect(state.trackingMode).toBe("fixed");
    expect(state.trackingPoints).toEqual([]);
    expect(state.slowmoStart).toBeNull();
    expect(state.slowmoEnd).toBeNull();
    expect(state.bgmId).toBeNull();
    expect(state.r2Key).toBeNull();
    expect(state.r2ClipId).toBeNull();
  });
});
