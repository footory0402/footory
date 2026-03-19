import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("profile_id", user.id)
    .order("year", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
