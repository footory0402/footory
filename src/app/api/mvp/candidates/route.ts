import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMvpCandidatesData } from "@/lib/server/mvp";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchMvpCandidatesData(supabase, user.id);
  return NextResponse.json(data);
}
