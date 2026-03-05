import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const VALID_REACTIONS = ["clap", "fire", "goal", "strong", "wow"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse optional reaction (default: clap)
  let reaction = "clap";
  try {
    const body = await req.json();
    if (body.reaction && VALID_REACTIONS.includes(body.reaction)) {
      reaction = body.reaction;
    }
  } catch { /* no body — default to clap */ }

  // If user already has a different reaction, remove it first (switch reaction)
  const { data: existing } = await supabase
    .from("kudos")
    .select("id, reaction")
    .eq("feed_item_id", feedItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.reaction === reaction) {
      return NextResponse.json({ error: "Already reacted" }, { status: 409 });
    }
    // Switch: delete old reaction first
    await supabase.from("kudos").delete().eq("id", existing.id);
  }

  const { error } = await supabase
    .from("kudos")
    .insert({ feed_item_id: feedItemId, user_id: user.id, reaction });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify feed item owner only on first-ever reaction
  if (!existing) {
    const { data: feedItem } = await supabase
      .from("feed_items")
      .select("profile_id")
      .eq("id", feedItemId)
      .single();

    if (feedItem && feedItem.profile_id !== user.id) {
      const { data: sender } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      await createNotification(supabase, {
        userId: feedItem.profile_id,
        type: "kudos",
        title: `${sender?.name ?? "누군가"}님이 응원했습니다`,
        referenceId: feedItemId,
      });
    }
  }

  return NextResponse.json({ ok: true, reaction }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let reaction = "clap";
  try {
    const body = await req.json();
    if (body.reaction && VALID_REACTIONS.includes(body.reaction)) {
      reaction = body.reaction;
    }
  } catch { /* default */ }

  const { error } = await supabase
    .from("kudos")
    .delete()
    .eq("feed_item_id", feedItemId)
    .eq("user_id", user.id)
    .eq("reaction", reaction);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
