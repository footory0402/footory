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
    const { name, type, date_text, result, goals, assists, is_mvp } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (date_text !== undefined) updates.date_text = date_text;
    if (result !== undefined) updates.result = result;
    if (goals !== undefined) updates.goals = goals;
    if (assists !== undefined) updates.assists = assists;
    if (is_mvp !== undefined) updates.is_mvp = is_mvp;

    const { error } = await supabase
      .from("tournament_records")
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
      .from("tournament_records")
      .delete()
      .eq("id", id)
      .eq("player_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
