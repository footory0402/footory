import { describe, expect, it } from "vitest";
import {
  buildSingleClipPlaybackContract,
  resolveSingleClipFreezePoint,
  resolveSingleClipPlayableDuration,
} from "@/lib/single-clip-playback";

describe("single-clip playback contract", () => {
  it("prefers trim window for playable duration", () => {
    expect(resolveSingleClipPlayableDuration({
      duration_seconds: 12,
      duration_sec: 7,
      trim_start: 2,
      trim_end: 8,
    })).toBe(6);
  });

  it("falls back to duration_sec before duration_seconds", () => {
    expect(resolveSingleClipPlayableDuration({
      duration_seconds: 12,
      duration_sec: 7,
    })).toBe(7);
  });

  it("maps snake_case clip rows into the shared playback contract", () => {
    const playback = buildSingleClipPlaybackContract({
      id: "clip-1",
      video_url: "/clip.mp4",
      thumbnail_url: "/clip.jpg",
      duration_seconds: 12,
      duration_sec: 7,
      trim_start: 1,
      trim_end: 8,
      highlight_start: 2,
      highlight_end: 6,
      spotlight_x: 0.4,
      spotlight_y: 0.3,
      freeze_at: 2.5,
      effects: {
        intro: true,
        showLowerThird: false,
        focusZoom: 2.2,
        trackingMode: "fixed",
        trackingPoints: [],
      },
    });

    expect(playback).toMatchObject({
      id: "clip-1",
      videoUrl: "/clip.mp4",
      thumbnailUrl: "/clip.jpg",
      duration: 7,
      trimStart: 1,
      trimEnd: 8,
      highlightStart: 2,
      highlightEnd: 6,
      spotlightX: 0.4,
      spotlightY: 0.3,
      freezeAt: 2.5,
      effects: {
        intro: true,
        showLowerThird: false,
        focusZoom: 2.2,
      },
    });
  });

  it("pushes an immediate freeze point slightly forward so playback can start before freezing", () => {
    const result = resolveSingleClipFreezePoint({
      duration: 8,
      trimStart: 0,
      trimEnd: 8,
      freezeAt: 0,
    });

    expect(result).toEqual({
      freezeAtSec: 0.8,
      isAdjustedFromImmediate: true,
    });
  });

  it("keeps a normal mid-clip freeze point unchanged", () => {
    const result = resolveSingleClipFreezePoint({
      duration: 8,
      trimStart: 1,
      trimEnd: 7,
      freezeAt: 3.2,
    });

    expect(result).toEqual({
      freezeAtSec: 3.2,
      isAdjustedFromImmediate: false,
    });
  });
});
