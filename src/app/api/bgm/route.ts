import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: tracks } = await supabase
    .from("bgm_tracks")
    .select("id, title, artist, category, r2_key, duration_sec")
    .eq("is_active", true)
    .order("category")
    .order("title");

  const mapped = (tracks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    category: t.category,
    r2Key: t.r2_key,
    durationSec: t.duration_sec,
  }));

  return NextResponse.json({ tracks: mapped });
}
