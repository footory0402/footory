import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clipId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const viewerId = user?.id ?? null;

    if (viewerId) {
      // Logged-in user: check existing before insert to avoid duplicate
      const { data: existing } = await supabase
        .from("clip_views")
        .select("id")
        .eq("clip_id", clipId)
        .eq("viewer_id", viewerId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from("clip_views")
          .insert({ clip_id: clipId, viewer_id: viewerId });

        if (error && !error.message.includes("duplicate")) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    } else {
      // Anonymous: just insert (no duplicate check)
      await supabase.from("clip_views").insert({ clip_id: clipId });
    }

    // Increment view_count on clips
    await supabase.rpc("increment_view_count", { clip_id_input: clipId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
