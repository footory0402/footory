import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// POST /api/push/token — Register FCM token
export async function POST(req: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/push/token — Unregister FCM token
export async function DELETE(req: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  await supabase
    .from("fcm_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("token", token);

  return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
