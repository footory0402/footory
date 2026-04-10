import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function normalizeBirthYear(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1900, Math.min(2100, Math.trunc(value)));
  }

  if (typeof value === "string") {
    const match = value.match(/\d{4}/);
    if (match) {
      return Math.max(1900, Math.min(2100, Number(match[0])));
    }
  }

  return null;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toLegacyCompatibleProfile(profile: {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  birth_year: number | null;
  bio: string | null;
  level: number;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
}) {
  return {
    ...profile,
    height: profile.height_cm,
    weight: profile.weight_kg,
    foot: profile.preferred_foot,
    birth_date: profile.birth_year ? String(profile.birth_year) : null,
    number: null,
    nationality: null,
  };
}

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
      .select("id, handle, name, avatar_url, position, birth_year, bio, level, height_cm, weight_kg, preferred_foot")
      .eq("id", childId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(toLegacyCompatibleProfile(profile));
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
    const updates: Record<string, unknown> = {};
    if ("name" in body) updates.name = typeof body.name === "string" ? body.name.trim() || null : null;
    if ("position" in body) updates.position = body.position;

    if ("height_cm" in body || "height" in body) {
      updates.height_cm = normalizeNumber(body.height_cm ?? body.height);
    }
    if ("weight_kg" in body || "weight" in body) {
      updates.weight_kg = normalizeNumber(body.weight_kg ?? body.weight);
    }
    if ("preferred_foot" in body || "foot" in body) {
      const preferredFoot = body.preferred_foot ?? body.foot;
      updates.preferred_foot =
        typeof preferredFoot === "string" && preferredFoot.trim()
          ? preferredFoot.trim()
          : null;
    }
    if ("birth_year" in body || "birth_date" in body) {
      updates.birth_year = normalizeBirthYear(body.birth_year ?? body.birth_date);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", childId)
      .select("id, handle, name, avatar_url, position, birth_year, bio, level, height_cm, weight_kg, preferred_foot")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toLegacyCompatibleProfile(profile));
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
