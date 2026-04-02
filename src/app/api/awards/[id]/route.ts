import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;
    const body = await req.json();
    const { title, detail, verifier } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (detail !== undefined) updates.detail = detail;
    if (verifier !== undefined) updates.verifier = verifier;

    const { error } = await supabase
      .from("awards")
      .update(updates)
      .eq("id", id)
      .eq("player_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;

    const { error } = await supabase
      .from("awards")
      .delete()
      .eq("id", id)
      .eq("player_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
