import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { putObjectToR2 } from "@/lib/r2";

function isAllowedKey(userId: string, key: string) {
  return (
    key.startsWith(`originals/${userId}/`) || key.startsWith(`thumbnails/${userId}/`)
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, retryAfter } = checkRateLimit(
      `upload-direct:${user.id}`,
      3_600_000,
      20
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const form = await req.formData();
    const key = String(form.get("key") ?? "");
    const contentType = String(form.get("contentType") ?? "application/octet-stream");
    const file = form.get("file");

    if (!key || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "key and file are required" },
        { status: 400 }
      );
    }

    if (!isAllowedKey(user.id, key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 403 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    await putObjectToR2(key, bytes, contentType);

    return NextResponse.json({ ok: true, key });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
