import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}
