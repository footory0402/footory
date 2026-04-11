import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { deleteOwnedClips } from "@/lib/server/clip-delete";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const body = await req.json().catch(() => null) as { clipIds?: unknown } | null;
    const clipIds = Array.isArray(body?.clipIds)
      ? body.clipIds.filter((clipId): clipId is string => typeof clipId === "string" && clipId.trim().length > 0)
      : [];
    const uniqueClipIds = Array.from(new Set(clipIds));

    if (uniqueClipIds.length === 0) {
      return NextResponse.json({ error: "삭제할 영상을 선택해 주세요." }, { status: 400 });
    }

    await deleteOwnedClips(supabase, uniqueClipIds, user.id);

    return NextResponse.json({ success: true, deletedClipIds: uniqueClipIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Not found" ? 404 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
