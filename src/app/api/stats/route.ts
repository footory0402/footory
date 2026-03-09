import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndAwardMedals } from "@/lib/medals";
import { MEASUREMENTS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { calculateLevel, estimateXp } from "@/lib/level";
import { notifyLinkedParents } from "@/lib/notifications";

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

  const { allowed, retryAfter } = checkRateLimit(`stats:${user.id}`, 60_000, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
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

  // Stat bounds validation
  const STAT_BOUNDS: Record<string, { min: number; max: number }> = {
    sprint_50m: { min: 4, max: 20 },
    kick_power: { min: 1, max: 200 },
    vertical_jump: { min: 1, max: 150 },
    shuttle_run: { min: 1, max: 200 },
    agility: { min: 1, max: 60 },
  };
  const bounds = STAT_BOUNDS[statType];
  if (bounds && (value < bounds.min || value > bounds.max)) {
    return NextResponse.json({ error: `값은 ${bounds.min}~${bounds.max} 범위여야 합니다` }, { status: 400 });
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

  // Recalculate level after stat + medal award
  let levelUpdated = false;
  try {
    const [profileRes, featuredRes, statsRes, topClipsRes, medalsRes, seasonsRes] = await Promise.all([
      supabase.from("profiles").select("avatar_url, name, position, birth_year, level").eq("id", user.id).single(),
      supabase.from("featured_clips").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
      supabase.from("stats").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
      supabase.from("clip_tags").select("id", { count: "exact", head: true }).eq("is_top", true).in("clip_id",
        (await supabase.from("clips").select("id").eq("owner_id", user.id)).data?.map((c) => c.id) ?? []
      ),
      supabase.from("medals").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
      supabase.from("seasons").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    ]);

    if (profileRes.data) {
      const counts = {
        featuredCount: featuredRes.count ?? 0,
        statsCount: statsRes.count ?? 0,
        topClipsCount: topClipsRes.count ?? 0,
        medalsCount: medalsRes.count ?? 0,
        seasonsCount: seasonsRes.count ?? 0,
      };
      const newLevel = calculateLevel(profileRes.data, counts);
      const newXp = estimateXp(profileRes.data, counts);
      if (newLevel !== profileRes.data.level) {
        await supabase.from("profiles").update({ level: newLevel, xp: newXp }).eq("id", user.id);
        levelUpdated = true;
      }
    }
  } catch {
    // Level recalc is non-critical — don't fail the request
  }

  // 연동된 부모에게 메달 획득 알림
  if (newMedals && newMedals.length > 0) {
    const { data: player } = await supabase
      .from("profiles")
      .select("name, handle")
      .eq("id", user.id)
      .single();

    if (player) {
      const medalLabels = newMedals.map((m) => m.label).join(", ");
      notifyLinkedParents(supabase, {
        childId: user.id,
        childName: player.name,
        type: "child_medal",
        title: `${player.name}님이 메달을 획득했어요!`,
        body: medalLabels,
        actionUrl: `/p/${player.handle}`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ stat, newMedals, levelUpdated });
}
