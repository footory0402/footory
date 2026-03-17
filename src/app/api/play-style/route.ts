import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { determinePlayStyle, type StyleTraitKey } from "@/lib/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFrom = any;

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    profileId: row.profile_id,
    styleType: row.style_type,
    traitBreakthrough: row.trait_breakthrough,
    traitCreativity: row.trait_creativity,
    traitFinishing: row.trait_finishing,
    traitTenacity: row.trait_tenacity,
    answers: row.answers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const profileId = req.nextUrl.searchParams.get("profileId");

  if (!profileId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ playStyle: null });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ playStyle: null });

    const { data } = await (supabase.from("play_styles") as AnyFrom)
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    return NextResponse.json({ playStyle: data ? mapRow(data) : null });
  }

  const { data } = await (supabase.from("play_styles") as AnyFrom)
    .select("*")
    .eq("profile_id", profileId)
    .single();

  return NextResponse.json({ playStyle: data ? mapRow(data) : null });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const { traits, answers } = body as {
    styleType: string;
    traits: Record<StyleTraitKey, number>;
    answers: number[];
  };

  const verifiedStyle = determinePlayStyle(traits);

  const row = {
    profile_id: profile.id,
    style_type: verifiedStyle,
    trait_breakthrough: Math.max(0, Math.min(15, traits.breakthrough ?? 0)),
    trait_creativity: Math.max(0, Math.min(15, traits.creativity ?? 0)),
    trait_finishing: Math.max(0, Math.min(15, traits.finishing ?? 0)),
    trait_tenacity: Math.max(0, Math.min(15, traits.tenacity ?? 0)),
    answers,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from("play_styles") as AnyFrom)
    .upsert(row, { onConflict: "profile_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ playStyle: mapRow(data) });
}
