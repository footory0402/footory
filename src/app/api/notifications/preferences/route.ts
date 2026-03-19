import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const body = await req.json();
    const updates = { ...body, profile_id: user.id, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(updates, { onConflict: "profile_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
