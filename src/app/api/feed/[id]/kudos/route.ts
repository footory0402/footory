import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already kudos'd
  const { data: existing } = await supabase
    .from("kudos")
    .select("id")
    .eq("feed_item_id", feedItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already kudos'd" }, { status: 409 });
  }

  const { error } = await supabase
    .from("kudos")
    .insert({ feed_item_id: feedItemId, user_id: user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification to feed item owner
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
    createNotification(supabase, {
      userId: feedItem.profile_id,
      type: "kudos",
      title: `${sender?.name ?? "누군가"}님이 응원했습니다`,
      referenceId: feedItemId,
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("kudos")
    .delete()
    .eq("feed_item_id", feedItemId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
