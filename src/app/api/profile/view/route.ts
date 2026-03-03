import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { profileId } = await request.json();

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  // Don't count self-views
  if (user?.id === profileId) {
    return NextResponse.json({ ok: true, counted: false });
  }

  // Read current count, then increment
  const { data } = await supabase
    .from("profiles")
    .select("views_count")
    .eq("id", profileId)
    .single();

  if (data) {
    await supabase
      .from("profiles")
      .update({ views_count: data.views_count + 1 })
      .eq("id", profileId);
  }

  return NextResponse.json({ ok: true, counted: true });
}
