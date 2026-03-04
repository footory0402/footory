import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage } from "@/lib/server/feed";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const { items, nextCursor } = await fetchFeedPage(supabase, user.id, cursor);

  return NextResponse.json(
    { items, nextCursor },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, reference_id, metadata } = body;

  const { data, error } = await supabase
    .from("feed_items")
    .insert({
      profile_id: user.id,
      type,
      reference_id: reference_id ?? null,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ feedItem: data }, { status: 201 });
}
