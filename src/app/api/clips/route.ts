import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SKILL_TAGS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { createNotification, notifyLinkedParents } from "@/lib/notifications";

const VALID_TAGS = SKILL_TAGS.map((t) => t.dbName);

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

  const { allowed, retryAfter } = checkRateLimit(`clips:${user.id}`, 60_000, 10);
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body = await req.json();
  const {
    video_url, duration_seconds, file_size_bytes, memo, tags,
    thumbnail_url, highlight_start, highlight_end,
  } = body as {
    video_url: string;
    duration_seconds?: number;
    file_size_bytes?: number;
    memo?: string;
    tags?: string[];
    thumbnail_url?: string;
    highlight_start?: number;
    highlight_end?: number;
  };

  // Always use server-generated ID — ignore any client-supplied id/clip_id
  const clip_id = crypto.randomUUID();

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
      id: clip_id,
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

  // Insert tags + auto is_top for first clip of each tag (batched)
  if (validTags.length > 0) {
    // Single query: get user's existing clip IDs
    const { data: userClips } = await supabase
      .from("clips")
      .select("id")
      .eq("owner_id", user.id)
      .neq("id", clip.id);

    const userClipIds = (userClips ?? []).map((c) => c.id);

    // Single query: count existing tags for user's other clips
    let existingTagNames: Set<string> = new Set();
    if (userClipIds.length > 0) {
      const { data: existingTags } = await supabase
        .from("clip_tags")
        .select("tag_name")
        .in("tag_name", validTags)
        .in("clip_id", userClipIds);
      existingTagNames = new Set((existingTags ?? []).map((t) => t.tag_name));
    }

    // Single bulk insert
    const { error: tagInsertError } = await supabase.from("clip_tags").insert(
      validTags.map((tagName) => ({
        clip_id: clip.id,
        tag_name: tagName,
        is_top: !existingTagNames.has(tagName),
      }))
    );

    if (tagInsertError) {
      console.error("[clips/POST] clip_tags insert error:", tagInsertError.message);
      // 태그 저장 실패해도 클립 자체는 이미 저장됨 — 클라이언트에 경고 포함해서 반환
      return NextResponse.json(
        { clip, warning: "태그 저장에 실패했습니다. 클립은 저장됐어요." },
        { status: 201 }
      );
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

  // K11: 관심 선수 새 영상 업로드 시 스카우터에게 알림
  const { data: uploader } = await supabase
    .from("profiles")
    .select("name, handle")
    .eq("id", user.id)
    .single();

  const { data: watchers } = await supabase
    .from("scout_watchlist")
    .select("scout_id")
    .eq("player_id", user.id);

  if (watchers && watchers.length > 0 && uploader) {
    await Promise.all(
      watchers.map((w) =>
        createNotification(supabase, {
          userId: w.scout_id,
          type: "watchlist_clip",
          title: `${uploader.name}님이 새 영상을 올렸어요`,
          body: "관심 선수의 새 클립을 확인하세요",
          referenceId: clip.id,
          actionUrl: `/p/${uploader.handle}`,
          groupKey: `watchlist_clip:${user.id}`,
        })
      )
    );
  }

  // 연동된 부모에게 자녀 클립 업로드 알림
  if (uploader) {
    notifyLinkedParents(supabase, {
      childId: user.id,
      type: "child_clip",
      title: `${uploader.name}님이 새 영상을 올렸어요`,
      body: validTags.length > 0 ? validTags.join(", ") : undefined,
      referenceId: clip.id,
      actionUrl: `/p/${uploader.handle}`,
    }).catch(() => {}); // fire and forget
  }

  return NextResponse.json({ clip }, { status: 201 });
}
