import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { SKILL_TAGS } from "@/lib/constants";

const VALID_TAGS = SKILL_TAGS.map((t) => t.dbName);

// POST: Parent quick upload — clip goes to child's library
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // Verify parent role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "parent") {
      return NextResponse.json({ error: "Parent role required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      child_id,
      video_url,
      duration_seconds,
      file_size_bytes,
      tags,
      clip_id,
      thumbnail_url,
      memo,
      highlight_start,
      highlight_end,
      raw_key,
      skill_labels,
      custom_labels,
      trim_start,
      trim_end,
      spotlight_x,
      spotlight_y,
      slowmo_start,
      slowmo_end,
      slowmo_speed,
      bgm_id,
      effects,
    } = body as {
      child_id: string;
      video_url: string;
      duration_seconds?: number;
      file_size_bytes?: number;
      tags?: string[];
      clip_id?: string;
      thumbnail_url?: string;
      memo?: string;
      highlight_start?: number;
      highlight_end?: number;
      raw_key?: string;
      skill_labels?: string[];
      custom_labels?: string[];
      trim_start?: number;
      trim_end?: number;
      spotlight_x?: number;
      spotlight_y?: number;
      slowmo_start?: number;
      slowmo_end?: number;
      slowmo_speed?: number;
      bgm_id?: string;
      effects?: Record<string, boolean>;
    };

    if (!child_id || !video_url) {
      return NextResponse.json({ error: "child_id and video_url are required" }, { status: 400 });
    }

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", child_id)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const validTags = (tags ?? []).filter((t: string) =>
      (VALID_TAGS as readonly string[]).includes(t)
    );

    // Insert clip — owner_id is the child, uploaded_by is the parent
    const highlightEnd = Math.round(Math.min(duration_seconds ?? 30, 30));
    const isRenderPipeline = !!raw_key;

    const { data: clip, error } = await supabase
      .from("clips")
      .insert({
        ...(clip_id ? { id: clip_id } : {}),
        owner_id: child_id,
        uploaded_by: user.id,
        video_url,
        duration_seconds: duration_seconds != null ? Math.round(duration_seconds) : null,
        file_size_bytes: file_size_bytes ?? null,
        memo: memo ?? null,
        thumbnail_url: thumbnail_url ?? null,
        highlight_start: Math.round(highlight_start ?? 0),
        highlight_end: Math.round(highlight_end ?? highlightEnd),
        highlight_status: isRenderPipeline ? "processing" : "done",
        ...(raw_key && { raw_key }),
        ...(skill_labels && { skill_labels }),
        ...(custom_labels && { custom_labels }),
        ...(trim_start !== undefined && { trim_start }),
        ...(trim_end !== undefined && { trim_end }),
        ...(spotlight_x !== undefined && { spotlight_x }),
        ...(spotlight_y !== undefined && { spotlight_y }),
        ...(slowmo_start !== undefined && { slowmo_start }),
        ...(slowmo_end !== undefined && { slowmo_end }),
        ...(slowmo_speed !== undefined && { slowmo_speed }),
        ...(bgm_id && { bgm_id }),
        ...(effects && { effects }),
      })
      .select()
      .single();

    if (error || !clip) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }

    // Insert tags
    if (validTags.length > 0) {
      for (const tagName of validTags) {
        const { count } = await supabase
          .from("clip_tags")
          .select("id", { count: "exact", head: true })
          .eq("tag_name", tagName)
          .in("clip_id",
            (await supabase.from("clips").select("id").eq("owner_id", child_id)).data?.map(c => c.id) ?? []
          );

        await supabase.from("clip_tags").insert({
          clip_id: clip.id,
          tag_name: tagName,
          is_top: (count ?? 0) === 0,
        });
      }
    }

    // Feed item goes to child's feed
    await supabase.from("feed_items").insert({
      profile_id: child_id,
      type: "highlight" as const,
      reference_id: clip.id,
      metadata: {
        video_url: clip.video_url,
        thumbnail_url: clip.thumbnail_url,
        duration: clip.duration_seconds,
        tags: validTags,
        uploaded_by_parent: true,
      },
    });

    return NextResponse.json({ clip }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
