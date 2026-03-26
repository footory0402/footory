import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// GET: Get child profile (parent must be linked)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id: childId } = await params;

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, height, weight, number, foot, birth_date, nationality, bio, level")
      .eq("id", childId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update child profile (parent must be linked)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id: childId } = await params;

    // Verify parent-child link
    const { data: link } = await supabase
      .from("parent_links")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Not linked to this child" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ["position", "height", "weight", "number", "foot", "birth_date", "nationality"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", childId)
      .select("id, handle, name, avatar_url, position, height, weight, number, foot, birth_date, nationality, bio, level")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
