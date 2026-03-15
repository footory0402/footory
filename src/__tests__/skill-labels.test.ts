import { describe, it, expect } from "vitest";
import {
  SKILL_LABELS,
  getSkillLabelsByPosition,
} from "@/lib/skill-labels";

describe("Skill Labels", () => {
  it("has 17 preset labels", () => {
    expect(SKILL_LABELS).toHaveLength(17);
  });

  it("has unique IDs", () => {
    const ids = SKILL_LABELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has 4 categories", () => {
    const categories = new Set(SKILL_LABELS.map((l) => l.category));
    expect(categories).toEqual(new Set(["common", "attack", "defense", "gk"]));
  });

  it("FW gets attack first, no GK labels", () => {
    const sections = getSkillLabelsByPosition("FW");
    expect(sections[0].category).toBe("attack");
    expect(sections.find((s) => s.category === "gk")).toBeUndefined();
  });

  it("DF gets defense first", () => {
    const sections = getSkillLabelsByPosition("DF");
    expect(sections[0].category).toBe("defense");
  });

  it("MF gets common first", () => {
    const sections = getSkillLabelsByPosition("MF");
    expect(sections[0].category).toBe("common");
  });

  it("GK only gets gk + common", () => {
    const sections = getSkillLabelsByPosition("GK");
    const categories = sections.map((s) => s.category);
    expect(categories).toEqual(["gk", "common"]);
  });

  it("null position uses FW order", () => {
    const sections = getSkillLabelsByPosition(null);
    expect(sections[0].category).toBe("attack");
  });

  it("each section has labels", () => {
    const sections = getSkillLabelsByPosition("FW");
    for (const section of sections) {
      expect(section.labels.length).toBeGreaterThan(0);
      expect(section.categoryLabel).toBeTruthy();
    }
  });
});
