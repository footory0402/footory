import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel, type LevelCounts } from "@/lib/level";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch counts for level calculation and display
  const [featured, stats, topClips, medals, seasons, team] = await Promise.all([
    supabase.from("featured_clips").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("stats").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("clip_tags").select("id, clip_id, clips!inner(owner_id)", { count: "exact", head: true })
      .eq("is_top", true)
      .eq("clips.owner_id" as never, user.id),
    supabase.from("medals").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("seasons").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("team_members").select("team_id, teams(name)").eq("profile_id", user.id).limit(1).single(),
  ]);

  const counts: LevelCounts = {
    featuredCount: featured.count ?? 0,
    statsCount: stats.count ?? 0,
    topClipsCount: topClips.count ?? 0,
    medalsCount: medals.count ?? 0,
    seasonsCount: seasons.count ?? 0,
  };

  // Calculate and update level if changed
  const newLevel = calculateLevel(profile, counts);
  if (newLevel !== profile.level) {
    await supabase.from("profiles").update({ level: newLevel }).eq("id", user.id);
  }

  const teamData = team.data as unknown as { team_id: string; teams: { name: string } } | null;

  return NextResponse.json({
    ...profile,
    level: newLevel,
    teamName: teamData?.teams?.name ?? null,
    teamId: teamData?.team_id ?? null,
    counts,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Allowed fields
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

  // Handle validation
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
  const [featured, stats, topClips, medals, seasons] = await Promise.all([
    supabase.from("featured_clips").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("stats").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("clip_tags").select("id, clip_id, clips!inner(owner_id)", { count: "exact", head: true })
      .eq("is_top", true)
      .eq("clips.owner_id" as never, user.id),
    supabase.from("medals").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase.from("seasons").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
  ]);

  const newLevel = calculateLevel(updated, {
    featuredCount: featured.count ?? 0,
    statsCount: stats.count ?? 0,
    topClipsCount: topClips.count ?? 0,
    medalsCount: medals.count ?? 0,
    seasonsCount: seasons.count ?? 0,
  });

  if (newLevel !== updated.level) {
    await supabase.from("profiles").update({ level: newLevel }).eq("id", user.id);
  }

  return NextResponse.json({ ...updated, level: newLevel });
}
