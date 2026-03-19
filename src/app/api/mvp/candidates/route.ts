import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { fetchMvpCandidatesData } from "@/lib/server/mvp";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const data = await fetchMvpCandidatesData(supabase, user.id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
