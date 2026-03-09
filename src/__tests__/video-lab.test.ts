import { describe, expect, it } from "vitest";
import {
  buildShortFormCopy,
  formatTimestamp,
  getShortFormPresetConfig,
  parseMatchRanges,
  parseTimestamp,
  SHORT_FORM_PRESETS,
  SHORT_FORM_TAGS,
} from "@/lib/video-lab";

describe("video lab helpers", () => {
  it("builds copy for every supported tag", () => {
    for (const tag of SHORT_FORM_TAGS) {
      const copy = buildShortFormCopy("민준", tag, "clean");
      expect(copy.headline).toContain("민준");
      expect(copy.badge).toBe(tag);
      expect(copy.caption.length).toBeGreaterThan(0);
      expect(copy.bgmLabel.length).toBeGreaterThan(0);
    }
  });

  it("returns a preset config for each preset", () => {
    for (const preset of SHORT_FORM_PRESETS) {
      const config = getShortFormPresetConfig(preset.id);
      expect(config.id).toBe(preset.id);
      expect(config.accent).toMatch(/^#/);
    }
  });

  it("parses match highlight ranges from textarea input", () => {
    const ranges = parseMatchRanges("00:10-00:15\n01:02-01:11");
    expect(ranges).toEqual([
      { startSeconds: 10, endSeconds: 15, label: "00:10-00:15" },
      { startSeconds: 62, endSeconds: 71, label: "01:02-01:11" },
    ]);
  });

  it("parses timestamps in both mm:ss and hh:mm:ss formats", () => {
    expect(parseTimestamp("01:15")).toBe(75);
    expect(parseTimestamp("01:02:03")).toBe(3723);
    expect(formatTimestamp(3723)).toBe("01:02:03");
  });
});
