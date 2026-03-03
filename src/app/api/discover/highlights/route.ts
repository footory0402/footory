import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 20);

  const supabase = await createClient();

  let query = supabase
    .from("feed_items")
    .select("*, profiles!feed_items_profile_id_fkey(id, handle, name, avatar_url, position, level)")
    .eq("type", "highlight")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data ?? [];
  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? result[result.length - 1].created_at : null;

  return NextResponse.json({ items: result, nextCursor });
}
