import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { SKILL_TAGS } from "@/lib/constants";
import { sanitizeTrackingPoints } from "@/lib/playback-focus";
import { deleteOwnedClip } from "@/lib/server/clip-delete";
import { buildClipFeedMetadata } from "@/lib/clip-feed-metadata";

const VALID_TAGS: string[] = SKILL_TAGS.map((t) => t.dbName);

function sanitizeEffects(effects: unknown) {
  if (!effects || typeof effects !== "object") return null;

  const candidate = effects as Record<string, unknown>;
  const nextEffects: Record<string, unknown> = {};

  if (typeof candidate.intro === "boolean") {
    nextEffects.intro = candidate.intro;
  }
  if (typeof candidate.showLowerThird === "boolean") {
    nextEffects.showLowerThird = candidate.showLowerThird;
  }
  if (typeof candidate.focusZoom === "number" && Number.isFinite(candidate.focusZoom)) {
    nextEffects.focusZoom = Math.max(1, Number(candidate.focusZoom));
  }
  if (typeof candidate.color === "boolean") {
    nextEffects.color = candidate.color;
  }
  if (typeof candidate.cinematic === "boolean") {
    nextEffects.cinematic = candidate.cinematic;
  }
  if (typeof candidate.eafc === "boolean") {
    nextEffects.eafc = candidate.eafc;
  }
  if (candidate.trackingMode === "fixed" || candidate.trackingMode === "follow") {
    nextEffects.trackingMode = candidate.trackingMode;
  }
  if (Array.isArray(candidate.trackingPoints)) {
    nextEffects.trackingPoints = sanitizeTrackingPoints(candidate.trackingPoints);
  }

  return nextEffects;
}

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
      .select("id, video_url, thumbnail_url, duration_seconds, duration_sec, trim_start, trim_end, highlight_start, highlight_end, spotlight_x, spotlight_y, freeze_at, effects")
      .eq("id", id)
      .single();

    if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: clipTags } = await supabase
      .from("clip_tags")
      .select("tag_name, is_top")
      .eq("clip_id", id)
      .order("is_top", { ascending: false });

    return NextResponse.json({
      clip: {
        ...clip,
        tags: (clipTags ?? []).map((tag) => tag.tag_name),
      },
    });
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
      .select("owner_id, effects")
      .eq("id", id)
      .single();

    if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (clip.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    let shouldSyncFeed = false;

    // Update thumbnail_url if provided (from parallel upload)
    if ("thumbnail_url" in body && typeof body.thumbnail_url === "string") {
      await supabase
        .from("clips")
        .update({ thumbnail_url: body.thumbnail_url })
        .eq("id", id);
      shouldSyncFeed = true;
    }

    // Update video_url if provided (from highlight generation)
    if ("video_url" in body && typeof body.video_url === "string") {
      await supabase
        .from("clips")
        .update({ video_url: body.video_url })
        .eq("id", id);
      shouldSyncFeed = true;
    }

    // Update memo if provided
    if ("memo" in body) {
      const memo = typeof body.memo === "string" ? body.memo.slice(0, 200) : null;
      const { error: memoErr } = await supabase
        .from("clips")
        .update({ memo })
        .eq("id", id);
      if (memoErr) return NextResponse.json({ error: memoErr.message }, { status: 500 });
      shouldSyncFeed = true;
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

    if (
      "highlight_start" in body ||
      "highlight_end" in body ||
      "trim_start" in body ||
      "trim_end" in body ||
      "duration_sec" in body ||
      "spotlight_x" in body ||
      "spotlight_y" in body ||
      "freeze_at" in body ||
      "effects" in body
    ) {
      const timingUpdates: Record<string, unknown> = {};

      if ("highlight_start" in body) {
        timingUpdates.highlight_start = typeof body.highlight_start === "number"
          ? Math.max(0, Math.round(body.highlight_start))
          : null;
      }

      if ("highlight_end" in body) {
        timingUpdates.highlight_end = typeof body.highlight_end === "number"
          ? Math.max(0, Math.round(body.highlight_end))
          : null;
      }

      if ("trim_start" in body) {
        timingUpdates.trim_start = typeof body.trim_start === "number"
          ? Math.max(0, Number(body.trim_start))
          : null;
      }

      if ("trim_end" in body) {
        timingUpdates.trim_end = typeof body.trim_end === "number"
          ? Math.max(0, Number(body.trim_end))
          : null;
      }

      if ("duration_sec" in body) {
        timingUpdates.duration_sec = typeof body.duration_sec === "number"
          ? Math.max(0, Number(body.duration_sec))
          : null;
      }

      if ("spotlight_x" in body) {
        timingUpdates.spotlight_x = typeof body.spotlight_x === "number"
          ? Math.max(0, Math.min(1, Number(body.spotlight_x)))
          : null;
      }

      if ("spotlight_y" in body) {
        timingUpdates.spotlight_y = typeof body.spotlight_y === "number"
          ? Math.max(0, Math.min(1, Number(body.spotlight_y)))
          : null;
      }

      if ("freeze_at" in body) {
        timingUpdates.freeze_at = typeof body.freeze_at === "number"
          ? Math.max(0, Number(body.freeze_at))
          : null;
      }

      if ("effects" in body) {
        const nextEffects = sanitizeEffects(body.effects);
        timingUpdates.effects = {
          ...((clip.effects as Record<string, unknown> | null) ?? {}),
          ...(nextEffects ?? {}),
        };
      }

      if (Object.keys(timingUpdates).length > 0) {
        const { error: timingErr } = await supabase
          .from("clips")
          .update(timingUpdates)
          .eq("id", id);
        if (timingErr) return NextResponse.json({ error: timingErr.message }, { status: 500 });
        shouldSyncFeed = true;
      }
    }

    // Update tags if provided
    let currentTags: string[] | null = null;
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
      currentTags = tags;
      shouldSyncFeed = true;
    }

    if (shouldSyncFeed) {
      const clipSelect = await supabase
        .from("clips")
        .select("id, video_url, thumbnail_url, duration_seconds, duration_sec, memo, trim_start, trim_end, spotlight_x, spotlight_y, freeze_at, slowmo_start, slowmo_end, slowmo_speed, bgm_id, effects")
        .eq("id", id)
        .single();

      if (clipSelect.error || !clipSelect.data) {
        return NextResponse.json({ error: clipSelect.error?.message ?? "클립 동기화에 실패했습니다." }, { status: 500 });
      }

      if (!currentTags) {
        const { data: tags } = await supabase
          .from("clip_tags")
          .select("tag_name")
          .eq("clip_id", id)
          .order("is_top", { ascending: false });
        currentTags = (tags ?? []).map((tag) => tag.tag_name);
      }

      const metadata = buildClipFeedMetadata(clipSelect.data, currentTags);

      const highlightFeedUpdate = supabase
        .from("feed_items")
        .update({ metadata })
        .eq("profile_id", user.id)
        .eq("type", "highlight")
        .eq("reference_id", id);

      const featuredMetadata = {
        clip_id: id,
        thumbnail_url: clipSelect.data.thumbnail_url,
      };

      const featuredFeedUpdate = supabase
        .from("feed_items")
        .update({ metadata: featuredMetadata })
        .eq("profile_id", user.id)
        .eq("type", "featured_change")
        .contains("metadata", { clip_id: id });

      const [{ error: highlightFeedError }, { error: featuredFeedError }] = await Promise.all([
        highlightFeedUpdate,
        featuredFeedUpdate,
      ]);

      if (highlightFeedError) {
        return NextResponse.json({ error: highlightFeedError.message }, { status: 500 });
      }
      if (featuredFeedError) {
        return NextResponse.json({ error: featuredFeedError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    await deleteOwnedClip(supabase, id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Not found" ? 404 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
