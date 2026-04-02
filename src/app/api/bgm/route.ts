import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

type BgmCategory = "cinematic" | "epic" | "chill" | "hype";

interface BgmTrack {
  id: string;
  title: string;
  artist: string;
  category: BgmCategory;
  r2_key: string;
  duration_sec: number;
  bpm: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const category = req.nextUrl.searchParams.get("category");

    const validCategories: BgmCategory[] = ["epic", "chill", "hype", "cinematic"];
    const validCategory = category && validCategories.includes(category as BgmCategory)
      ? category
      : null;

    // bgm_tracks is not in generated database types yet — use any cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    let query = db
      .from("bgm_tracks")
      .select("id, title, artist, category, r2_key, duration_sec, bpm")
      .eq("is_active", true)
      .order("category")
      .order("title");

    if (validCategory) {
      query = query.eq("category", validCategory);
    }

    const { data, error } = await query;
    if (error) throw error;

    const tracks = ((data ?? []) as BgmTrack[]).map((t) => ({
      ...t,
      url: `${R2_PUBLIC_URL}/${t.r2_key}`,
    }));

    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
