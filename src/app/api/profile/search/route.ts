import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const role = searchParams.get("role");

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [] });
    }

    let query = supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position")
      .neq("id", user.id)
      .limit(10);

    // Search by handle or name
    if (q.startsWith("@")) {
      query = query.ilike("handle", `%${q.slice(1)}%`);
    } else {
      query = query.or(`name.ilike.%${q}%,handle.ilike.%${q}%`);
    }

    if (role && ["player", "parent", "scout"].includes(role)) {
      query = query.eq("role", role as "player" | "parent" | "scout");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json({ results: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
