import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { method, team_code, document_url } = body;

  if (!method || !["team_code", "document"].includes(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  // Insert verification request
  const { error } = await supabase.from("coach_verifications").insert({
    profile_id: user.id,
    method,
    team_code: method === "team_code" ? team_code : null,
    document_url: method === "document" ? document_url : null,
    status: "pending",
  });

  if (error) {
    console.error("Coach verification insert error:", error);
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }

  return NextResponse.json({ status: "pending" });
}
