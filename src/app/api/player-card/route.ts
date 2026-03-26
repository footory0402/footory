import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPresignedCardPhotoUrl } from "@/lib/r2";

// GET: Load saved card (own or child's via ?profileId=xxx)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId") || user.id;

    // If requesting another profile's card, verify parent-child link
    if (profileId !== user.id) {
      const { data: link } = await supabase
        .from("parent_links")
        .select("id")
        .eq("parent_id", user.id)
        .eq("child_id", profileId)
        .single();

      if (!link) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    // Get card
    const { data: card } = await supabase
      .from("player_cards")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    // Get profile data for auto-fill
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, position, height_cm, weight_kg, preferred_foot, birth_year, avatar_url")
      .eq("id", profileId)
      .single();

    return NextResponse.json({ card, profile });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save/update card (upsert)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const body = await request.json();
    const { profileId, template, clubName, mainColor, accentColor, cardData, needPhotoUploadUrl } = body;

    const targetId = profileId || user.id;

    // If saving for another profile, verify parent-child link
    if (targetId !== user.id) {
      const { data: link } = await supabase
        .from("parent_links")
        .select("id")
        .eq("parent_id", user.id)
        .eq("child_id", targetId)
        .single();

      if (!link) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    // Check existing card
    const { data: existing } = await supabase
      .from("player_cards")
      .select("id")
      .eq("profile_id", targetId)
      .single();

    if (existing) {
      // Update
      const { data: card, error } = await supabase
        .from("player_cards")
        .update({
          template: template || "fifa",
          club_name: clubName || null,
          main_color: mainColor || "#37474F",
          accent_color: accentColor || "#78909C",
          card_data: cardData || {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Generate photo upload URL if requested
      let photoUploadUrl: string | undefined;
      if (needPhotoUploadUrl) {
        const presign = await getPresignedCardPhotoUrl(targetId);
        photoUploadUrl = presign.url;
      }

      return NextResponse.json({ card, photoUploadUrl });
    } else {
      // Insert
      const { data: card, error } = await supabase
        .from("player_cards")
        .insert({
          profile_id: targetId,
          template: template || "fifa",
          club_name: clubName || null,
          main_color: mainColor || "#37474F",
          accent_color: accentColor || "#78909C",
          card_data: cardData || {},
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      let photoUploadUrl: string | undefined;
      if (needPhotoUploadUrl) {
        const presign = await getPresignedCardPhotoUrl(targetId);
        photoUploadUrl = presign.url;
      }

      return NextResponse.json({ card, photoUploadUrl }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
