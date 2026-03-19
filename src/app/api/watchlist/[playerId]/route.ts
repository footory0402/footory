import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth-guard";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { note, notify_on_upload } = await req.json();

    const { data, error } = await supabase
      .from("scout_watchlist")
      .update({ note, notify_on_upload })
      .eq("scout_id", user.id)
      .eq("player_id", playerId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { error } = await supabase
      .from("scout_watchlist")
      .delete()
      .eq("scout_id", user.id)
      .eq("player_id", playerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 워치리스트 여부 확인 (auth optional — skip refactoring)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ watching: false });

  const { data } = await supabase
    .from("scout_watchlist")
    .select("id")
    .eq("scout_id", user.id)
    .eq("player_id", playerId)
    .maybeSingle();

  return NextResponse.json({ watching: !!data });
}
