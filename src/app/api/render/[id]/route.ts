import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

/**
 * GET /api/render/[id]
 * 렌더 작업 상태 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data: job, error } = await supabase
    .from("render_jobs")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
