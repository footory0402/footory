import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  const body = await request.json();
  const { role, name, handle, position, birth_year, avatar_url, height_cm, weight_kg, preferred_foot, bio } = body;

  // Validate required fields
  if (!name || !handle || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Input length validation
  if ((typeof name === "string" && name.length > 50) ||
      (typeof handle === "string" && handle.length > 20)) {
    return NextResponse.json({ error: "입력값이 너무 깁니다" }, { status: 400 });
  }

  // Enum validation
  const VALID_ROLES = ["player", "parent", "scout"] as const;
  const VALID_POSITIONS = ["FW", "MF", "DF", "GK"] as const;

  if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (role === "player" && position && !VALID_POSITIONS.includes(position as typeof VALID_POSITIONS[number])) {
    return NextResponse.json({ error: "Invalid position" }, { status: 400 });
  }

  // Validate handle format
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
  }

  // Check handle uniqueness
  const { data: handleTaken } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

  if (handleTaken) {
    return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
  }

  // Validate optional numeric fields
  if (height_cm != null && (typeof height_cm !== "number" || height_cm < 100 || height_cm > 220)) {
    return NextResponse.json({ error: "Invalid height" }, { status: 400 });
  }
  if (weight_kg != null && (typeof weight_kg !== "number" || weight_kg < 20 || weight_kg > 150)) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }
  const VALID_FEET = ["left", "right", "both"];
  if (preferred_foot && !VALID_FEET.includes(preferred_foot)) {
    return NextResponse.json({ error: "Invalid preferred foot" }, { status: 400 });
  }

  // Insert profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      name,
      handle,
      role,
      position: role === "player" ? position : null,
      birth_year: birth_year || null,
      avatar_url: avatar_url || null,
      height_cm: role === "player" ? (height_cm || null) : null,
      weight_kg: role === "player" ? (weight_kg || null) : null,
      preferred_foot: role === "player" ? (preferred_foot || null) : null,
      bio: bio || null,
      level: 1,
      xp: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Onboarding insert error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
