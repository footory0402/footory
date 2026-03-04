import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel, type LevelCounts } from "@/lib/level";
import type { SupabaseClient } from "@supabase/supabase-js";

async function fetchCounts(supabase: SupabaseClient, userId: string): Promise<LevelCounts> {
  const [featured, stats, topClips, medals, seasons] = await Promise.all([
    supabase.from("featured_clips").select("*", { count: "exact", head: true }).eq("profile_id", userId),
    supabase.from("stats").select("*", { count: "exact", head: true }).eq("profile_id", userId),
    supabase.from("clip_tags").select("*, clips!inner(owner_id)", { count: "exact", head: true })
      .eq("is_top", true)
      .eq("clips.owner_id" as never, userId),
    supabase.from("medals").select("*", { count: "exact", head: true }).eq("profile_id", userId),
    supabase.from("seasons").select("*", { count: "exact", head: true }).eq("profile_id", userId),
  ]);
  return {
    featuredCount: featured.count ?? 0,
    statsCount: stats.count ?? 0,
    topClipsCount: topClips.count ?? 0,
    medalsCount: medals.count ?? 0,
    seasonsCount: seasons.count ?? 0,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch profile, counts, and team in parallel
  const [profileResult, counts, teamResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    fetchCounts(supabase, user.id),
    supabase.from("team_members").select("team_id, teams(name)").eq("profile_id", user.id).limit(1).single(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = profileResult.data;
  const newLevel = calculateLevel(profile, counts);

  // Fire-and-forget level update (don't await)
  if (newLevel !== profile.level) {
    supabase.from("profiles").update({ level: newLevel }).eq("id", user.id).then();
  }

  const teamData = teamResult.data as unknown as { team_id: string; teams: { name: string } } | null;

  return NextResponse.json({
    ...profile,
    level: newLevel,
    teamName: teamData?.teams?.name ?? null,
    teamId: teamData?.team_id ?? null,
    counts,
  }, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Input length validation
  const LENGTH_LIMITS: Record<string, number> = { name: 50, bio: 200, city: 50 };
  for (const [field, max] of Object.entries(LENGTH_LIMITS)) {
    if (body[field] && typeof body[field] === "string" && body[field].length > max) {
      return NextResponse.json({ error: "입력값이 너무 깁니다" }, { status: 400 });
    }
  }

  const allowed = ["name", "handle", "position", "birth_year", "city", "bio", "public_email", "public_phone", "show_email", "show_phone"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  if (updates.handle) {
    const handle = updates.handle as string;
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .neq("id", user.id)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Handle taken" }, { status: 409 });
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate level
  const counts = await fetchCounts(supabase, user.id);
  const newLevel = calculateLevel(updated, counts);

  if (newLevel !== updated.level) {
    await supabase.from("profiles").update({ level: newLevel }).eq("id", user.id);
  }

  return NextResponse.json({ ...updated, level: newLevel });
}
