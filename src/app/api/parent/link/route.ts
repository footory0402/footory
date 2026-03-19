import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// GET: List linked children
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // Verify parent role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "parent") {
      return NextResponse.json({ error: "Parent role required" }, { status: 403 });
    }

    const { data: links, error } = await supabase
      .from("parent_links")
      .select("id, child_id, created_at, profiles!parent_links_child_id_fkey(id, handle, name, avatar_url, position, level)")
      .eq("parent_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get counts for each child
    const children = await Promise.all(
      (links ?? []).map(async (link) => {
        const child = link.profiles as unknown as {
          id: string; handle: string; name: string;
          avatar_url: string | null; position: string | null; level: number;
        };

        const clips = await supabase.from("clips").select("id", { count: "exact", head: true }).eq("owner_id", child.id);

        return {
          linkId: link.id,
          childId: child.id,
          handle: child.handle,
          name: child.name,
          avatarUrl: child.avatar_url,
          position: child.position,
          level: child.level,
          medalCount: 0,
          clipCount: clips.count ?? 0,
          linkedAt: link.created_at,
        };
      })
    );

    return NextResponse.json(children);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Link to a child by handle
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "parent") {
      return NextResponse.json({ error: "Parent role required" }, { status: 403 });
    }

    const { handle } = await request.json();
    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    // Find child profile
    const { data: child } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("handle", handle)
      .single();

    if (!child) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (child.role !== "player") {
      return NextResponse.json({ error: "Can only link to player accounts" }, { status: 400 });
    }

    // Check existing link
    const { data: existing } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", child.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already linked" }, { status: 409 });
    }

    const { error } = await supabase
      .from("parent_links")
      .insert({ parent_id: user.id, child_id: child.id });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, childId: child.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Unlink a child
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    if (!childId) {
      return NextResponse.json({ error: "childId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("parent_links")
      .delete()
      .eq("parent_id", user.id)
      .eq("child_id", childId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
