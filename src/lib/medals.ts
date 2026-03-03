import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

export interface AwardedMedal {
  id: string;
  medalCode: string;
  icon: string;
  label: string;
  statType: string;
  threshold: number;
  comparison: "lte" | "gte";
}

export async function checkAndAwardMedals(
  supabase: SupabaseClient<Database>,
  profileId: string,
  statType: string,
  value: number,
  statId: string
): Promise<AwardedMedal[]> {
  // Get all criteria for this stat type
  const { data: criteria } = await supabase
    .from("medal_criteria")
    .select("*")
    .eq("stat_type", statType);

  if (!criteria || criteria.length === 0) return [];

  // Filter criteria that the value meets
  const met = criteria.filter((c) =>
    c.comparison === "lte" ? value <= c.threshold : value >= c.threshold
  );

  if (met.length === 0) return [];

  // Check which medals the user already has
  const codes = met.map((c) => c.code);
  const { data: existing } = await supabase
    .from("medals")
    .select("medal_code")
    .eq("profile_id", profileId)
    .in("medal_code", codes);

  const existingCodes = new Set((existing ?? []).map((m) => m.medal_code));
  const newCriteria = met.filter((c) => !existingCodes.has(c.code));

  if (newCriteria.length === 0) return [];

  // Insert new medals
  const inserts = newCriteria.map((c) => ({
    profile_id: profileId,
    medal_code: c.code,
    stat_id: statId,
  }));

  const { data: inserted } = await supabase
    .from("medals")
    .insert(inserts)
    .select("id, medal_code");

  if (!inserted) return [];

  return inserted.map((m) => {
    const c = newCriteria.find((c) => c.code === m.medal_code)!;
    return {
      id: m.id,
      medalCode: m.medal_code,
      icon: c.icon,
      label: c.label,
      statType: c.stat_type,
      threshold: c.threshold,
      comparison: c.comparison,
    };
  });
}
