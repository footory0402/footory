import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 없으면 기본값 반환
  if (!data) {
    return NextResponse.json({
      profile_id: user.id,
      push_enabled: true,
      kudos: true,
      comments: true,
      follows: true,
      dm: true,
      mentions: true,
      vote_open: true,
      vote_remind: true,
      mvp_result: true,
      team_invite: true,
      weekly_recap: true,
      upload_nudge: false,
      quiet_start: "22:00",
      quiet_end: "08:00",
    });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates = { ...body, profile_id: user.id, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(updates, { onConflict: "profile_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
