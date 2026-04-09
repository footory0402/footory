import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { SKILL_TAGS } from "@/lib/constants";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const VALID_TAGS: string[] = SKILL_TAGS.map((t) => t.dbName);

/** GET /api/clips/[id] — fetch clip video_url (auth required) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const { data: clip } = await supabase
      .from("clips")
      .select("id, video_url, thumbnail_url, duration_seconds")
      .eq("id", id)
      .single();

    if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ clip });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** PATCH /api/clips/[id] — update tags */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data: clip } = await supabase
      .from("clips")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (clip.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Update thumbnail_url if provided (from parallel upload)
    if ("thumbnail_url" in body && typeof body.thumbnail_url === "string") {
      await supabase
        .from("clips")
        .update({ thumbnail_url: body.thumbnail_url })
        .eq("id", id);
    }

    // Update video_url if provided (from highlight generation)
    if ("video_url" in body && typeof body.video_url === "string") {
      await supabase
        .from("clips")
        .update({ video_url: body.video_url })
        .eq("id", id);
    }

    // Update memo if provided
    if ("memo" in body) {
      const memo = typeof body.memo === "string" ? body.memo.slice(0, 200) : null;
      const { error: memoErr } = await supabase
        .from("clips")
        .update({ memo })
        .eq("id", id);
      if (memoErr) return NextResponse.json({ error: memoErr.message }, { status: 500 });
    }

    // Update skill_labels / custom_labels if provided
    if ("skill_labels" in body || "custom_labels" in body) {
      const updates: Record<string, unknown> = {};
      if ("skill_labels" in body) {
        updates.skill_labels = Array.isArray(body.skill_labels)
          ? body.skill_labels.slice(0, 3)
          : [];
      }
      if ("custom_labels" in body) {
        updates.custom_labels = Array.isArray(body.custom_labels)
          ? body.custom_labels.slice(0, 2).map((l: string) => String(l).slice(0, 10))
          : [];
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("clips").update(updates).eq("id", id);
      }
    }

    // Update tags if provided
    if ("tags" in body) {
      const tags: string[] = (body.tags ?? []).filter((t: string) => VALID_TAGS.includes(t));

      // Delete existing tags
      await supabase.from("clip_tags").delete().eq("clip_id", id);

      // Insert new tags
      if (tags.length > 0) {
        const tagRows = tags.map((tag_name: string, i: number) => ({
          clip_id: id,
          tag_name,
          is_top: i === 0,
        }));
        const { error } = await supabase.from("clip_tags").insert(tagRows);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function extractR2Key(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length).replace(/^\//, "");
}

async function deleteR2Objects(keys: (string | null)[]) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  if (!accountId || !accessKeyId || !secretAccessKey) return;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await Promise.allSettled(
    keys.filter(Boolean).map((key) =>
      client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key! }))
    )
  );
}

async function assertNoError(
  action: string,
  promise: PromiseLike<{ error: { message: string } | null }>
) {
  const { error } = await promise;
  if (error) {
    throw new Error(`${action}: ${error.message}`);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // Verify ownership and get URLs/keys for R2 cleanup
    const { data: clip } = await supabase
      .from("clips")
      .select("owner_id, video_url, thumbnail_url, raw_key")
      .eq("id", id)
      .single();

    if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (clip.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete dependent records first (FK constraints)
    await assertNoError(
      "delete featured clips",
      supabase.from("featured_clips").delete().eq("clip_id", id)
    );
    await assertNoError(
      "delete clip tags",
      supabase.from("clip_tags").delete().eq("clip_id", id)
    );
    await assertNoError(
      "delete coach reviews",
      supabase.from("coach_reviews").delete().eq("clip_id", id)
    );
    await assertNoError(
      "clear shared clips from messages",
      (supabase.from("messages") as any).update({ shared_clip_id: null }).eq("shared_clip_id", id)
    );
    await assertNoError(
      "clear evidence clips from stats",
      supabase.from("stats").update({ evidence_clip_id: null }).eq("evidence_clip_id", id)
    );
    await assertNoError(
      "clear highlight clips from seasons",
      supabase.from("seasons").update({ highlight_clip_id: null }).eq("highlight_clip_id", id)
    );
    await assertNoError(
      "clear clip references from reports",
      (supabase.from("reports") as any).update({ clip_id: null }).eq("clip_id", id)
    );
    await assertNoError(
      "clear clip references from weekly mvp results",
      (supabase.from("weekly_mvp_results") as any).update({ clip_id: null }).eq("clip_id", id)
    );

    const { data: highlights, error: highlightsError } = await supabase
      .from("highlights")
      .select("id, clip_ids")
      .eq("owner_id", user.id)
      .contains("clip_ids", [id]);
    if (highlightsError) {
      throw new Error(`load highlights: ${highlightsError.message}`);
    }
    for (const highlight of highlights ?? []) {
      const remainingClipIds = (highlight.clip_ids ?? []).filter((clipId) => clipId !== id);
      if (remainingClipIds.length < 2) {
        await assertNoError(
          "delete highlight with removed clip",
          supabase.from("highlights").delete().eq("id", highlight.id)
        );
        continue;
      }
      await assertNoError(
        "update highlight clips",
        supabase.from("highlights").update({ clip_ids: remainingClipIds }).eq("id", highlight.id)
      );
    }

    // Delete feed items referencing this clip (and their kudos/comments)
    const { data: feedItems } = await supabase
      .from("feed_items")
      .select("id")
      .eq("reference_id", id);
    if (feedItems && feedItems.length > 0) {
      const feedIds = feedItems.map((f: { id: string }) => f.id);
      await assertNoError(
        "delete feed kudos",
        supabase.from("kudos").delete().in("feed_item_id", feedIds)
      );
      await assertNoError(
        "delete feed comments",
        supabase.from("comments").delete().in("feed_item_id", feedIds)
      );
      await assertNoError(
        "delete feed items",
        supabase.from("feed_items").delete().eq("reference_id", id)
      );
    }

    await assertNoError(
      "delete clip",
      supabase.from("clips").delete().eq("id", id)
    );

    // Best-effort R2 file deletion (failures don't affect response)
    const videoKey = clip.video_url ? extractR2Key(clip.video_url) : null;
    const thumbKey = clip.thumbnail_url ? extractR2Key(clip.thumbnail_url) : null;
    const rawKey = typeof clip.raw_key === "string" ? clip.raw_key : null;
    await deleteR2Objects([videoKey, thumbKey, rawKey]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
