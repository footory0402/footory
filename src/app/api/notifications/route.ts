import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const cursor = req.nextUrl.searchParams.get("cursor");

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: items, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const nextCursor =
      items && items.length === PAGE_SIZE
        ? items[items.length - 1].created_at
        : null;

    return NextResponse.json({ items: items ?? [], nextCursor }, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
