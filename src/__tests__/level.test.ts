import { describe, it, expect } from "vitest";
import { calculateLevel, type LevelCounts } from "@/lib/level";

const baseProfile = {
  avatar_url: "https://example.com/avatar.jpg",
  name: "테스트 선수",
  position: "FW" as const,
  birth_year: 2010,
};

const zeroCounts: LevelCounts = {
  featuredCount: 0,
  statsCount: 0,
  topClipsCount: 0,
  medalsCount: 0,
  seasonsCount: 0,
};

describe("calculateLevel", () => {
  it("returns level 1 when profile is incomplete", () => {
    const incompleteProfile = { ...baseProfile, avatar_url: null };
    expect(calculateLevel(incompleteProfile, zeroCounts)).toBe(1);
  });

  it("returns level 2 when profile is complete", () => {
    expect(calculateLevel(baseProfile, zeroCounts)).toBe(2);
  });

  it("returns level 3 with featured + stat", () => {
    const counts: LevelCounts = { ...zeroCounts, featuredCount: 1, statsCount: 1 };
    expect(calculateLevel(baseProfile, counts)).toBe(3);
  });

  it("returns level 4 with top clips + medal", () => {
    const counts: LevelCounts = {
      ...zeroCounts,
      featuredCount: 1,
      statsCount: 1,
      topClipsCount: 2,
      medalsCount: 1,
    };
    expect(calculateLevel(baseProfile, counts)).toBe(4);
  });

  it("returns level 5 with season + 2 featured", () => {
    const counts: LevelCounts = {
      featuredCount: 2,
      statsCount: 1,
      topClipsCount: 2,
      medalsCount: 1,
      seasonsCount: 1,
    };
    expect(calculateLevel(baseProfile, counts)).toBe(5);
  });

  it("does not skip levels (needs lv3 prereqs for lv4)", () => {
    // Has top clips + medal but no featured/stat
    const counts: LevelCounts = {
      ...zeroCounts,
      topClipsCount: 5,
      medalsCount: 3,
    };
    expect(calculateLevel(baseProfile, counts)).toBe(2);
  });
});
