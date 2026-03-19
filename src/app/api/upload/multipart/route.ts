import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createMultipartUpload,
  getPresignedPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  listMultipartParts,
} from "@/lib/r2";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

function isAllowedKey(userId: string, key: string) {
  return (
    key.startsWith(`originals/${userId}/`) ||
    key.startsWith(`raw/${userId}/`)
  );
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { allowed, retryAfter } = checkRateLimit(
      `multipart:${user.id}`,
      3_600_000,
      200
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, key, uploadId, partNumber, parts, contentType } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }
    if (!isAllowedKey(user.id, key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 403 });
    }

    switch (action) {
      case "init": {
        if (!contentType) {
          return NextResponse.json({ error: "contentType required" }, { status: 400 });
        }
        const id = await createMultipartUpload(key, contentType);
        return NextResponse.json({ uploadId: id });
      }

      case "presign-part": {
        if (!uploadId || typeof uploadId !== "string") {
          return NextResponse.json({ error: "uploadId required" }, { status: 400 });
        }
        if (typeof partNumber !== "number" || partNumber < 1 || partNumber > 10000) {
          return NextResponse.json({ error: "valid partNumber required" }, { status: 400 });
        }
        const url = await getPresignedPartUrl(key, uploadId, partNumber);
        return NextResponse.json({ url });
      }

      case "complete": {
        if (!uploadId || typeof uploadId !== "string") {
          return NextResponse.json({ error: "uploadId required" }, { status: 400 });
        }
        // 브라우저에서 ETag 헤더 읽기 (CORS 이슈 우회) 대신
        // 서버에서 ListParts로 실제 ETags를 가져와 CompleteMultipartUpload 실행
        const actualParts = await listMultipartParts(key, uploadId);
        if (actualParts.length === 0) {
          return NextResponse.json({ error: "업로드된 파트 없음" }, { status: 400 });
        }
        await completeMultipartUpload(key, uploadId, actualParts);
        return NextResponse.json({ ok: true });
      }

      case "abort": {
        if (!uploadId || typeof uploadId !== "string") {
          return NextResponse.json({ error: "uploadId required" }, { status: 400 });
        }
        await abortMultipartUpload(key, uploadId);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[upload/multipart] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
