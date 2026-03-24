import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data, error } = await supabase
      .from("tournament_records")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const body = await req.json();
    const { name, type, date_text, result, goals, assists, is_mvp } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const validTypes = ["공식대회", "리그", "친선"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tournament_records")
      .insert({
        player_id: user.id,
        name: name.trim(),
        type,
        date_text: date_text?.trim() || null,
        result: result?.trim() || null,
        goals: Number(goals) || 0,
        assists: Number(assists) || 0,
        is_mvp: Boolean(is_mvp),
        source: "self",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
