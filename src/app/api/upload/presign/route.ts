import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl, getPresignedThumbnailUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type ?? "video";
    const clipId = body.clipId ?? crypto.randomUUID();

    if (type === "thumbnail") {
      const { url, key } = await getPresignedThumbnailUrl(user.id, clipId);
      return NextResponse.json({ url, key, clipId });
    }

    const { url, key } = await getPresignedUploadUrl(user.id, clipId);
    return NextResponse.json({ url, key, clipId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
