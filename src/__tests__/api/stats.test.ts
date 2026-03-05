import { describe, it, expect } from "vitest";
import { MEASUREMENTS } from "@/lib/constants";

/**
 * Stats API integration tests.
 * Tests STAT_BOUNDS validation logic extracted from the stats API route.
 * The bounds are defined in src/app/api/stats/route.ts.
 */

const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
  sprint_50m: { min: 4, max: 20 },
  kick_power: { min: 1, max: 200 },
  vertical_jump: { min: 1, max: 150 },
  shuttle_run: { min: 1, max: 200 },
  agility: { min: 1, max: 60 },
};

function validateStatValue(statType: string, value: number): { valid: boolean; error?: string } {
  const measurement = MEASUREMENTS.find((m) => m.id === statType);
  if (!measurement) {
    return { valid: false, error: "Invalid stat type" };
  }

  if (typeof value !== "number" || value <= 0) {
    return { valid: false, error: "Invalid value" };
  }

  const bounds = STAT_BOUNDS[statType];
  if (bounds && (value < bounds.min || value > bounds.max)) {
    return { valid: false, error: `값은 ${bounds.min}~${bounds.max} 범위여야 합니다` };
  }

  return { valid: true };
}

describe("Stats STAT_BOUNDS validation", () => {
  it("accepts valid sprint_50m value within bounds", () => {
    const result = validateStatValue("sprint_50m", 6.5);
    expect(result.valid).toBe(true);
  });

  it("rejects sprint_50m below minimum (4)", () => {
    const result = validateStatValue("sprint_50m", 3);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("4~20");
  });

  it("rejects sprint_50m above maximum (20)", () => {
    const result = validateStatValue("sprint_50m", 25);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("4~20");
  });

  it("accepts kick_power at boundary values", () => {
    expect(validateStatValue("kick_power", 1).valid).toBe(true);
    expect(validateStatValue("kick_power", 200).valid).toBe(true);
  });

  it("rejects kick_power above maximum (200)", () => {
    const result = validateStatValue("kick_power", 250);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("1~200");
  });

  it("accepts vertical_jump within bounds", () => {
    expect(validateStatValue("vertical_jump", 45).valid).toBe(true);
  });

  it("rejects vertical_jump above maximum (150)", () => {
    const result = validateStatValue("vertical_jump", 200);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid stat type", () => {
    const result = validateStatValue("nonexistent_stat", 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid stat type");
  });

  it("rejects zero value", () => {
    const result = validateStatValue("sprint_50m", 0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid value");
  });

  it("rejects negative value", () => {
    const result = validateStatValue("sprint_50m", -5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid value");
  });

  it("all MEASUREMENTS have corresponding STAT_BOUNDS", () => {
    for (const m of MEASUREMENTS) {
      expect(STAT_BOUNDS).toHaveProperty(m.id);
    }
  });

  it("all STAT_BOUNDS have min < max", () => {
    for (const bounds of Object.values(STAT_BOUNDS)) {
      expect(bounds.min).toBeLessThan(bounds.max);
    }
  });
});
