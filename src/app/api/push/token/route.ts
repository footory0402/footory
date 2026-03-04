import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/push/token — Register FCM token
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, deviceInfo } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { error } = await supabase
    .from("fcm_tokens")
    .upsert(
      {
        user_id: user.id,
        token,
        device_info: deviceInfo ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/token — Unregister FCM token
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  await supabase
    .from("fcm_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("token", token);

  return NextResponse.json({ ok: true });
}
