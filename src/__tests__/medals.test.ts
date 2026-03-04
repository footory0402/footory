import { describe, it, expect, vi } from "vitest";
import { checkAndAwardMedals } from "@/lib/medals";

function createMockSupabase(criteria: Record<string, unknown>[], existingMedals: string[] = []) {
  const insertedRows: Record<string, unknown>[] = [];

  return {
    from: (table: string) => {
      if (table === "medal_criteria") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: criteria, error: null }),
          }),
        };
      }
      if (table === "medals") {
        return {
          select: (columns?: string) => {
            if (columns === "medal_code") {
              return {
                eq: () => ({
                  in: () =>
                    Promise.resolve({
                      data: existingMedals.map((c) => ({ medal_code: c })),
                      error: null,
                    }),
                }),
              };
            }
            // insert().select() chain
            return {
              data: insertedRows.map((r, i) => ({
                id: `medal-${i}`,
                medal_code: r.medal_code,
              })),
              error: null,
            };
          },
          insert: (rows: Record<string, unknown>[]) => {
            insertedRows.push(...rows);
            return {
              select: () => ({
                data: rows.map((r, i) => ({
                  id: `medal-${i}`,
                  medal_code: r.medal_code,
                })),
                error: null,
              }),
            };
          },
        };
      }
      return {};
    },
  };
}

describe("checkAndAwardMedals", () => {
  it("returns empty array when no criteria exist", async () => {
    const supabase = createMockSupabase([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkAndAwardMedals(supabase as any, "p1", "sprint_50m", 6.5, "s1");
    expect(result).toEqual([]);
  });

  it("awards medal when value meets gte threshold", async () => {
    const criteria = [
      {
        code: "kick_power_bronze",
        stat_type: "kick_power",
        threshold: 80,
        comparison: "gte",
        icon: "🥉",
        label: "킥파워 브론즈",
      },
    ];
    const supabase = createMockSupabase(criteria);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkAndAwardMedals(supabase as any, "p1", "kick_power", 85, "s1");
    expect(result).toHaveLength(1);
    expect(result[0].medalCode).toBe("kick_power_bronze");
    expect(result[0].label).toBe("킥파워 브론즈");
  });

  it("awards medal when value meets lte threshold", async () => {
    const criteria = [
      {
        code: "sprint_gold",
        stat_type: "sprint_50m",
        threshold: 7.0,
        comparison: "lte",
        icon: "🥇",
        label: "스프린트 골드",
      },
    ];
    const supabase = createMockSupabase(criteria);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkAndAwardMedals(supabase as any, "p1", "sprint_50m", 6.5, "s1");
    expect(result).toHaveLength(1);
    expect(result[0].medalCode).toBe("sprint_gold");
  });

  it("does not award already-owned medals", async () => {
    const criteria = [
      {
        code: "sprint_gold",
        stat_type: "sprint_50m",
        threshold: 7.0,
        comparison: "lte",
        icon: "🥇",
        label: "스프린트 골드",
      },
    ];
    const supabase = createMockSupabase(criteria, ["sprint_gold"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkAndAwardMedals(supabase as any, "p1", "sprint_50m", 6.5, "s1");
    expect(result).toEqual([]);
  });

  it("does not award medal when value does not meet threshold", async () => {
    const criteria = [
      {
        code: "kick_power_bronze",
        stat_type: "kick_power",
        threshold: 80,
        comparison: "gte",
        icon: "🥉",
        label: "킥파워 브론즈",
      },
    ];
    const supabase = createMockSupabase(criteria);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkAndAwardMedals(supabase as any, "p1", "kick_power", 50, "s1");
    expect(result).toEqual([]);
  });
});
