import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndAwardMedals } from "@/lib/medals";
import { MEASUREMENTS } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch stats ordered by most recent
  const { data: stats, error } = await supabase
    .from("stats")
    .select("*")
    .eq("profile_id", user.id)
    .order("recorded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch medals with criteria info
  const { data: medals } = await supabase
    .from("medals")
    .select("*, medal_criteria(*)")
    .eq("profile_id", user.id)
    .order("achieved_at", { ascending: false });

  return NextResponse.json({ stats: stats ?? [], medals: medals ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { statType, value, evidenceClipId } = body;

  // Validate stat type
  const measurement = MEASUREMENTS.find((m) => m.id === statType);
  if (!measurement) {
    return NextResponse.json({ error: "Invalid stat type" }, { status: 400 });
  }

  if (typeof value !== "number" || value <= 0) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  // Insert stat
  const { data: stat, error } = await supabase
    .from("stats")
    .insert({
      profile_id: user.id,
      stat_type: statType,
      value,
      unit: measurement.unit,
      evidence_clip_id: evidenceClipId || null,
    })
    .select()
    .single();

  if (error || !stat) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // Check for new medals
  const newMedals = await checkAndAwardMedals(
    supabase,
    user.id,
    statType,
    value,
    stat.id
  );

  // Auto-create feed item for stat
  await supabase.from("feed_items").insert({
    profile_id: user.id,
    type: "stat" as const,
    reference_id: stat.id,
    metadata: {
      stat_type: statType,
      stat_label: measurement.label,
      value,
      unit: measurement.unit,
    },
  });

  // Auto-create feed items for new medals
  if (newMedals && newMedals.length > 0) {
    for (const medal of newMedals) {
      await supabase.from("feed_items").insert({
        profile_id: user.id,
        type: "medal" as const,
        reference_id: medal.id,
        metadata: {
          icon: medal.icon ?? "🏅",
          label: medal.label ?? "메달 획득",
          stat_type: measurement.label,
          value,
          unit: measurement.unit,
        },
      });
    }
  }

  return NextResponse.json({ stat, newMedals });
}
