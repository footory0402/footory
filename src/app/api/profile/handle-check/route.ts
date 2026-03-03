import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");

  if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("profiles").select("id").eq("handle", handle);
  if (user) {
    query = query.neq("id", user.id);
  }

  const { data } = await query.single();

  return NextResponse.json({ available: !data });
}
