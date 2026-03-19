import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
