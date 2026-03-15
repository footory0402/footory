import { describe, it, expect, beforeEach } from "vitest";
import { useUploadStore } from "@/stores/upload-store";

describe("Upload Store v1.3", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
  });

  it("has correct initial v1.3 state", () => {
    const state = useUploadStore.getState();
    expect(state.step).toBe(0);
    expect(state.trimStart).toBe(0);
    expect(state.trimEnd).toBeNull();
    expect(state.spotlightX).toBeNull();
    expect(state.spotlightY).toBeNull();
    expect(state.skillLabels).toEqual([]);
    expect(state.customLabels).toEqual([]);
    expect(state.slowmoStart).toBeNull();
    expect(state.slowmoEnd).toBeNull();
    expect(state.slowmoSpeed).toBe(0.5);
    expect(state.bgmId).toBeNull();
    expect(state.effects).toEqual({
      color: true,
      cinematic: true,
      eafc: true,
      intro: true,
    });
    expect(state.renderJobId).toBeNull();
  });

  it("sets step correctly", () => {
    const store = useUploadStore.getState();
    store.setStep(3);
    expect(useUploadStore.getState().step).toBe(3);
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

  it("sets custom labels", () => {
    const store = useUploadStore.getState();
    store.setCustomLabels(["무회전킥", "바나나킥"]);
    expect(useUploadStore.getState().customLabels).toEqual([
      "무회전킥",
      "바나나킥",
    ]);
  });

  it("sets slowmo with speed", () => {
    const store = useUploadStore.getState();
    store.setSlowmo(10.5, 15.5, 0.3);
    const state = useUploadStore.getState();
    expect(state.slowmoStart).toBe(10.5);
    expect(state.slowmoEnd).toBe(15.5);
    expect(state.slowmoSpeed).toBe(0.3);
  });

  it("sets effects partially", () => {
    const store = useUploadStore.getState();
    store.setEffects({ color: false, eafc: false });
    const state = useUploadStore.getState();
    expect(state.effects).toEqual({
      color: false,
      cinematic: true,
      eafc: false,
      intro: true,
    });
  });

  it("sets renderJobId", () => {
    const store = useUploadStore.getState();
    store.setRenderJobId("job-123");
    expect(useUploadStore.getState().renderJobId).toBe("job-123");
  });

  it("has new status types", () => {
    const store = useUploadStore.getState();
    store.setStatus("editing");
    expect(useUploadStore.getState().status).toBe("editing");
    store.setStatus("uploading_raw");
    expect(useUploadStore.getState().status).toBe("uploading_raw");
    store.setStatus("creating_job");
    expect(useUploadStore.getState().status).toBe("creating_job");
    store.setStatus("rendering");
    expect(useUploadStore.getState().status).toBe("rendering");
  });

  it("reset clears all v1.3 fields", () => {
    const store = useUploadStore.getState();
    store.setStep(4);
    store.setTrimStart(10);
    store.setSpotlight(0.5, 0.5);
    store.setSkillLabels(["dribble"]);
    store.setSlowmo(5, 10, 0.25);
    store.setBgmId("bgm-1");
    store.setEffects({ color: false });
    store.setRenderJobId("job-1");

    store.reset();

    const state = useUploadStore.getState();
    expect(state.step).toBe(0);
    expect(state.trimStart).toBe(0);
    expect(state.spotlightX).toBeNull();
    expect(state.skillLabels).toEqual([]);
    expect(state.slowmoStart).toBeNull();
    expect(state.bgmId).toBeNull();
    expect(state.effects.color).toBe(true);
    expect(state.renderJobId).toBeNull();
  });
});
