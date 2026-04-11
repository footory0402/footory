import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const supabase = await createClient();
    const { handle } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const [
      stats,
      seasons,
      achievements,
      playStyle,
      tournamentRecords,
      awards,
    ] = await Promise.all([
      supabase.from("stats").select("*").eq("profile_id", profile.id).order("recorded_at", { ascending: false }),
      supabase.from("seasons").select("*").eq("profile_id", profile.id).order("year", { ascending: false }),
      supabase.from("achievements").select("*").eq("profile_id", profile.id).order("year", { ascending: false }),
      supabase.from("play_styles").select("*").eq("profile_id", profile.id).maybeSingle(),
      supabase.from("tournament_records").select("*").eq("player_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("awards").select("*").eq("player_id", profile.id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      stats: stats.data ?? [],
      seasons: seasons.data ?? [],
      achievements: achievements.data ?? [],
      playStyle: playStyle.data ?? null,
      tournamentRecords: tournamentRecords.data ?? [],
      awards: awards.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
