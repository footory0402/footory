import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl, getPresignedThumbnailUrl } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, retryAfter } = checkRateLimit(`presign:${user.id}`, 3_600_000, 50);
    if (!allowed) {
      return NextResponse.json({ error: "Too Many Requests" }, {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type ?? "video";
    const clipId = body.clipId ?? crypto.randomUUID();
    const prefix = body.prefix ?? "originals"; // "raw" for v1.3 render pipeline
    const fileSize = body.fileSize ?? undefined;

    // 확장자 기반 MIME type 보정 (모바일 브라우저 오보고 대응)
    let contentType = body.contentType ?? "video/mp4";
    if (body.fileName) {
      const ext = body.fileName.split(".").pop()?.toLowerCase();
      const extMap: Record<string, string> = {
        mov: "video/quicktime",
        m4v: "video/x-m4v",
        webm: "video/webm",
        avi: "video/x-msvideo",
        mp4: "video/mp4",
      };
      if (ext && extMap[ext]) contentType = extMap[ext];
    }

    if (type === "thumbnail") {
      const { url, key } = await getPresignedThumbnailUrl(user.id, clipId);
      return NextResponse.json({ url, key, clipId });
    }

    const { url, key } = await getPresignedUploadUrl(user.id, clipId, contentType, prefix, fileSize);
    return NextResponse.json({ url, key, clipId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
