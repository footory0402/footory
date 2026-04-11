import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

type SupabaseLike = Pick<SupabaseClient<Database>, "from">;

type OwnedClipRecord = {
  owner_id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  raw_key?: string | null;
};

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

export async function loadOwnedClipOrThrow(
  supabase: SupabaseLike,
  clipId: string,
  userId: string,
): Promise<OwnedClipRecord> {
  const { data: clip } = await supabase
    .from("clips")
    .select("owner_id, video_url, thumbnail_url, raw_key")
    .eq("id", clipId)
    .single();

  if (!clip) {
    throw new Error("Not found");
  }

  if (clip.owner_id !== userId) {
    throw new Error("Forbidden");
  }

  return clip as unknown as OwnedClipRecord;
}

export async function deleteOwnedClip(
  supabase: SupabaseLike,
  clipId: string,
  userId: string,
) {
  const clip = await loadOwnedClipOrThrow(supabase, clipId, userId);

  const messageTable = supabase.from("messages" as never) as unknown as {
    update: (payload: { shared_clip_id: null }) => {
      eq: (column: "shared_clip_id", value: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const reportTable = supabase.from("reports" as never) as unknown as {
    update: (payload: { clip_id: null }) => {
      eq: (column: "clip_id", value: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const weeklyMvpResultTable = supabase.from("weekly_mvp_results" as never) as unknown as {
    update: (payload: { clip_id: null }) => {
      eq: (column: "clip_id", value: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };

  await assertNoError(
    "delete featured clips",
    supabase.from("featured_clips").delete().eq("clip_id", clipId)
  );
  await assertNoError(
    "delete clip tags",
    supabase.from("clip_tags").delete().eq("clip_id", clipId)
  );
  await assertNoError(
    "delete coach reviews",
    supabase.from("coach_reviews").delete().eq("clip_id", clipId)
  );
  await assertNoError(
    "clear shared clips from messages",
    messageTable.update({ shared_clip_id: null }).eq("shared_clip_id", clipId)
  );
  await assertNoError(
    "clear evidence clips from stats",
    supabase.from("stats").update({ evidence_clip_id: null }).eq("evidence_clip_id", clipId)
  );
  await assertNoError(
    "clear highlight clips from seasons",
    supabase.from("seasons").update({ highlight_clip_id: null }).eq("highlight_clip_id", clipId)
  );
  await assertNoError(
    "clear clip references from reports",
    reportTable.update({ clip_id: null }).eq("clip_id", clipId)
  );
  await assertNoError(
    "clear clip references from weekly mvp results",
    weeklyMvpResultTable.update({ clip_id: null }).eq("clip_id", clipId)
  );

  const { data: highlights, error: highlightsError } = await supabase
    .from("highlights")
    .select("id, clip_ids")
    .eq("owner_id", userId)
    .contains("clip_ids", [clipId]);
  if (highlightsError) {
    throw new Error(`load highlights: ${highlightsError.message}`);
  }
  for (const highlight of highlights ?? []) {
    const remainingClipIds = ((highlight.clip_ids as string[] | null) ?? []).filter((id) => id !== clipId);
    if (remainingClipIds.length < 2) {
      await assertNoError(
        "delete highlight with removed clip",
        supabase.from("highlights").delete().eq("id", String(highlight.id))
      );
      continue;
    }
    await assertNoError(
      "update highlight clips",
      supabase.from("highlights").update({ clip_ids: remainingClipIds }).eq("id", String(highlight.id))
    );
  }

  const { data: feedItems } = await supabase
    .from("feed_items")
    .select("id")
    .eq("reference_id", clipId);
  if (feedItems && feedItems.length > 0) {
    const feedIds = feedItems.map((item) => String(item.id));
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
      supabase.from("feed_items").delete().eq("reference_id", clipId)
    );
  }

  await assertNoError(
    "delete clip",
    supabase.from("clips").delete().eq("id", clipId)
  );

  const videoKey = clip.video_url ? extractR2Key(clip.video_url) : null;
  const thumbKey = clip.thumbnail_url ? extractR2Key(clip.thumbnail_url) : null;
  const rawKey = typeof clip.raw_key === "string" ? clip.raw_key : null;
  await deleteR2Objects([videoKey, thumbKey, rawKey]);
}

export async function deleteOwnedClips(
  supabase: SupabaseLike,
  clipIds: string[],
  userId: string,
) {
  for (const clipId of clipIds) {
    await loadOwnedClipOrThrow(supabase, clipId, userId);
  }

  for (const clipId of clipIds) {
    await deleteOwnedClip(supabase, clipId, userId);
  }
}
