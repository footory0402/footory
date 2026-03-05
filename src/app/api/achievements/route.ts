import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("profile_id", user.id)
    .order("year", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, competition, year, evidence_url } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("achievements")
    .insert({
      profile_id: user.id,
      title: title.trim(),
      competition: competition?.trim() || null,
      year: year ? Number(year) : null,
      evidence_url: evidence_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create timeline event
  await supabase.from("timeline_events").insert({
    profile_id: user.id,
    event_type: "achievement",
    event_data: { title: data.title, competition: data.competition },
  });

  return NextResponse.json(data, { status: 201 });
}
