import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  // Allow fetching by profile_id query param (for public profiles) or own
  const profileId = req.nextUrl.searchParams.get("profile_id");

  if (profileId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Own timeline
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
