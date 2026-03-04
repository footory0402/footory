import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 18), 30);

  const supabase = await createClient();

  if (!tag) {
    // Return all tags with counts
    const { data, error } = await supabase
      .from("clip_tags")
      .select("tag_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count occurrences per tag
    const counts: Record<string, number> = {};
    (data ?? []).forEach((row) => {
      counts[row.tag_name] = (counts[row.tag_name] ?? 0) + 1;
    });

    const tags = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      { tags },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  }

  // Get clip_ids for the given tag
  const { data: tagRows, error: tagError } = await supabase
    .from("clip_tags")
    .select("clip_id")
    .eq("tag_name", tag)
    .limit(limit);

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  if (!tagRows || tagRows.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const clipIds = tagRows.map((r) => r.clip_id);

  // Fetch clip details
  const { data: clips, error: clipError } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url, duration_seconds, owner_id")
    .in("id", clipIds)
    .order("created_at", { ascending: false });

  if (clipError) {
    return NextResponse.json({ error: clipError.message }, { status: 500 });
  }

  // Fetch owner profiles
  const ownerIds = [...new Set((clips ?? []).map((c) => c.owner_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, handle, name")
    .in("id", ownerIds);

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

  const items = (clips ?? []).map((c) => {
    const owner = ownerMap.get(c.owner_id);
    return {
      id: c.id,
      tag_name: tag,
      thumbnail_url: c.thumbnail_url,
      video_url: c.video_url,
      duration_seconds: c.duration_seconds,
      owner_handle: owner?.handle ?? "",
      owner_name: owner?.name ?? "",
    };
  });

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
