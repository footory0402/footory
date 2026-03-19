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

    const { data: albums, error } = await supabase
      .from("team_albums")
      .select("*")
      .eq("team_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(albums ?? []);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // Check membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", id)
      .eq("profile_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const { media_type, media_url, thumbnail_url } = body;

    if (!media_type || !media_url) {
      return NextResponse.json({ error: "media_type and media_url are required" }, { status: 400 });
    }

    const { data: album, error } = await supabase
      .from("team_albums")
      .insert({
        team_id: id,
        uploaded_by: user.id,
        media_type,
        media_url,
        thumbnail_url: thumbnail_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(album, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
