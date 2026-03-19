import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    // Get active team members (admin, member — exclude alumni)
    const { data: members } = await supabase
      .from("team_members")
      .select("profile_id")
      .eq("team_id", id)
      .in("role", ["admin", "member"]);

    if (!members || members.length === 0) {
      return NextResponse.json([]);
    }

    const profileIds = members.map((m) => m.profile_id);

    // Get clips from these members (using correct column names from schema)
    const { data: clips } = await supabase
      .from("clips")
      .select("id, memo, thumbnail_url, duration_seconds, created_at, owner_id")
      .in("owner_id", profileIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!clips || clips.length === 0) {
      return NextResponse.json([]);
    }

    // Get tags for these clips
    const clipIds = clips.map((c) => c.id);
    const { data: clipTags } = await supabase
      .from("clip_tags")
      .select("clip_id, tag_name")
      .in("clip_id", clipIds);

    const tagMap = new Map<string, string[]>();
    for (const ct of clipTags ?? []) {
      const existing = tagMap.get(ct.clip_id) ?? [];
      existing.push(ct.tag_name);
      tagMap.set(ct.clip_id, existing);
    }

    // Get profiles for the clip owners
    const uniqueProfileIds = [...new Set(clips.map((c) => c.owner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level")
      .in("id", uniqueProfileIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const result = clips.map((c) => {
      const profile = profileMap.get(c.owner_id);
      return {
        id: c.id,
        title: c.memo,
        thumbnailUrl: c.thumbnail_url,
        duration: c.duration_seconds ?? 0,
        tags: tagMap.get(c.id) ?? [],
        createdAt: c.created_at,
        player: {
          id: profile?.id ?? c.owner_id,
          handle: profile?.handle ?? "",
          name: profile?.name ?? "",
          avatarUrl: profile?.avatar_url ?? undefined,
          position: profile?.position ?? undefined,
          level: profile?.level ?? 1,
        },
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
