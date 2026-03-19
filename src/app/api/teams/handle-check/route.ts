import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      return NextResponse.json({ available: false, reason: "Invalid format" });
    }

    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("handle", handle)
      .single();

    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
