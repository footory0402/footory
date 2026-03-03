import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TAGS = [
  "1v1 돌파", "슈팅", "퍼스트터치", "전진패스", "헤딩경합", "1v1 수비", "기타",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: clips } = await supabase
    .from("clips")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ clips: clips ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    video_url, duration_seconds, file_size_bytes, memo, tags, clip_id,
    thumbnail_url, highlight_start, highlight_end,
  } = body as {
    video_url: string;
    duration_seconds?: number;
    file_size_bytes?: number;
    memo?: string;
    tags?: string[];
    clip_id?: string;
    thumbnail_url?: string;
    highlight_start?: number;
    highlight_end?: number;
  };

  if (!video_url) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  // Validate tags
  const validTags = (tags ?? []).filter((t: string) =>
    (VALID_TAGS as readonly string[]).includes(t)
  );

  // Insert clip
  const { data: clip, error } = await supabase
    .from("clips")
    .insert({
      ...(clip_id ? { id: clip_id } : {}),
      owner_id: user.id,
      uploaded_by: user.id,
      video_url,
      duration_seconds: duration_seconds ?? null,
      file_size_bytes: file_size_bytes ?? null,
      memo: memo ?? null,
      thumbnail_url: thumbnail_url ?? null,
      highlight_start: highlight_start ?? 0,
      highlight_end: highlight_end ?? Math.min(duration_seconds ?? 30, 30),
      highlight_status: "done",
    })
    .select()
    .single();

  if (error || !clip) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // Insert tags + auto is_top for first clip of each tag
  if (validTags.length > 0) {
    for (const tagName of validTags) {
      // Check if this is the first clip for this tag
      const { count } = await supabase
        .from("clip_tags")
        .select("id", { count: "exact", head: true })
        .eq("tag_name", tagName)
        .in("clip_id",
          (await supabase.from("clips").select("id").eq("owner_id", user.id)).data?.map(c => c.id) ?? []
        );

      await supabase.from("clip_tags").insert({
        clip_id: clip.id,
        tag_name: tagName,
        is_top: (count ?? 0) === 0,
      });
    }
  }

  // Auto-create feed item
  await supabase.from("feed_items").insert({
    profile_id: user.id,
    type: "highlight" as const,
    reference_id: clip.id,
    metadata: {
      thumbnail_url: clip.thumbnail_url,
      duration: clip.duration_seconds,
      tags: validTags,
      memo: clip.memo,
    },
  });

  return NextResponse.json({ clip }, { status: 201 });
}
