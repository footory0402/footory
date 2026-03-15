import { describe, it, expect } from "vitest";
import { BGM_CATEGORIES } from "@/lib/bgm-tracks";

describe("BGM Tracks", () => {
  it("has 4 categories", () => {
    expect(BGM_CATEGORIES).toHaveLength(4);
  });

  it("has unique category IDs", () => {
    const ids = BGM_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each category has label and emoji", () => {
    for (const cat of BGM_CATEGORIES) {
      expect(cat.label).toBeTruthy();
      expect(cat.emoji).toBeTruthy();
    }
  });

  it("includes expected categories", () => {
    const ids = BGM_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("epic");
    expect(ids).toContain("chill");
    expect(ids).toContain("hype");
    expect(ids).toContain("cinematic");
  });
});
