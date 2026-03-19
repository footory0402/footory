import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function PUT() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
