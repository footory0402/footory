import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SKILL_TAGS } from "@/lib/constants";

const VALID_TAGS: string[] = SKILL_TAGS.map((t) => t.dbName);

/** GET /api/clips/[id] — fetch clip video_url (auth required) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: clip } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url, duration_seconds")
    .eq("id", id)
    .single();

  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ clip });
}

/** PATCH /api/clips/[id] — update tags */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: clip } = await supabase
    .from("clips")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (clip.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete dependent records first (FK constraints)
  await supabase.from("featured_clips").delete().eq("clip_id", id);
  await supabase.from("highlights").delete().eq("clip_id", id);
  await supabase.from("clip_tags").delete().eq("clip_id", id);
  await supabase.from("coach_reviews").delete().eq("clip_id", id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("messages") as any).update({ shared_clip_id: null }).eq("shared_clip_id", id);

  // Delete feed items referencing this clip (and their kudos/comments)
  const { data: feedItems } = await supabase
    .from("feed_items")
    .select("id")
    .eq("reference_id", id);
  if (feedItems && feedItems.length > 0) {
    const feedIds = feedItems.map((f: { id: string }) => f.id);
    await supabase.from("kudos").delete().in("feed_item_id", feedIds);
    await supabase.from("comments").delete().in("feed_item_id", feedIds);
    await supabase.from("feed_items").delete().eq("reference_id", id);
  }

  const { error } = await supabase.from("clips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
