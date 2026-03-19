import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const MAX_FEATURED = 3;

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data } = await supabase
      .from("featured_clips")
      .select("*, clips(*)")
      .eq("profile_id", user.id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ featured: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { clip_id } = await req.json();
    if (!clip_id) return NextResponse.json({ error: "clip_id required" }, { status: 400 });

    // Check max limit
    const { count } = await supabase
      .from("featured_clips")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if ((count ?? 0) >= MAX_FEATURED) {
      return NextResponse.json({ error: "최대 3개까지 설정 가능합니다" }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("featured_clips")
      .select("id")
      .eq("profile_id", user.id)
      .eq("clip_id", clip_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "이미 Featured에 추가된 클립입니다" }, { status: 400 });
    }

    const nextOrder = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from("featured_clips")
      .insert({ profile_id: user.id, clip_id, sort_order: nextOrder })
      .select("*, clips(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Auto-create feed item
    const clipData = (data as { clips?: { thumbnail_url?: string } })?.clips;
    await supabase.from("feed_items").insert({
      profile_id: user.id,
      type: "featured_change" as const,
      reference_id: data.id,
      metadata: {
        clip_id,
        thumbnail_url: clipData?.thumbnail_url ?? null,
      },
    });

    return NextResponse.json({ featured: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { clip_id } = await req.json();
    if (!clip_id) return NextResponse.json({ error: "clip_id required" }, { status: 400 });

    await supabase
      .from("featured_clips")
      .delete()
      .eq("profile_id", user.id)
      .eq("clip_id", clip_id);

    // Re-order remaining
    const { data: remaining } = await supabase
      .from("featured_clips")
      .select("id")
      .eq("profile_id", user.id)
      .order("sort_order", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("featured_clips")
          .update({ sort_order: i + 1 })
          .eq("id", remaining[i].id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
