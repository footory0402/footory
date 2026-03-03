import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sort_order } = await req.json();

  if (typeof sort_order !== "number" || sort_order < 1 || sort_order > 3) {
    return NextResponse.json({ error: "Invalid sort_order" }, { status: 400 });
  }

  const { error } = await supabase
    .from("featured_clips")
    .update({ sort_order })
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
