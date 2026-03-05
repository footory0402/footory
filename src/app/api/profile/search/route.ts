import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (role && ["player", "parent", "other"].includes(role)) {
    query = query.eq("role", role as "player" | "parent" | "other");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
