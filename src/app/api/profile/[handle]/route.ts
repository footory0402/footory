import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch related data
  const [featured, stats, medals, seasons, team] = await Promise.all([
    supabase
      .from("featured_clips")
      .select("id, clip_id, sort_order, clips(video_url, thumbnail_url, highlight_start, highlight_end, duration)")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("stats")
      .select("*")
      .eq("profile_id", profile.id)
      .order("measured_at", { ascending: false }),
    supabase
      .from("medals")
      .select("*")
      .eq("profile_id", profile.id)
      .order("awarded_at", { ascending: false }),
    supabase
      .from("seasons")
      .select("*")
      .eq("profile_id", profile.id)
      .order("year", { ascending: false }),
    supabase
      .from("team_members")
      .select("team_id, teams(name)")
      .eq("profile_id", profile.id)
      .neq("role", "alumni")
      .limit(1)
      .single(),
  ]);

  // Filter contact info based on privacy settings
  const contact: Record<string, string> = {};
  if (profile.show_email && profile.public_email) {
    contact.email = profile.public_email;
  }
  if (profile.show_phone && profile.public_phone) {
    contact.phone = profile.public_phone;
  }

  const teamData = team.data as unknown as { team_id: string; teams: { name: string } } | null;

  return NextResponse.json({
    ...profile,
    contact: Object.keys(contact).length > 0 ? contact : null,
    teamName: teamData?.teams?.name ?? null,
    teamId: teamData?.team_id ?? null,
    featured: featured.data ?? [],
    stats: stats.data ?? [],
    medals: medals.data ?? [],
    seasons: seasons.data ?? [],
  });
}
