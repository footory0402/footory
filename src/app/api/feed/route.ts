import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { fetchFeedPage } from "@/lib/server/feed";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const cursor = req.nextUrl.searchParams.get("cursor");
    const { items, nextCursor } = await fetchFeedPage(supabase, user.id, cursor);

    return NextResponse.json(
      { items, nextCursor },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
