import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SKILL_TAGS } from "@/lib/constants";

const VALID_TAGS: string[] = SKILL_TAGS.map((t) => t.dbName);

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

  return NextResponse.json({ success: true, tags });
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

  const { error } = await supabase.from("clips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
