import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { POSITION_LABELS, LEVELS } from "@/lib/constants";

export const runtime = "nodejs";
export const alt = "Footory 선수 프로필";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, position, level, birth_year, city, avatar_url")
    .eq("handle", handle)
    .single();

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0C0C0E",
            color: "#FAFAFA",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          Footory
        </div>
      ),
      { ...size }
    );
  }

  const lvl = LEVELS[Math.min(profile.level, 5) - 1];
  const posLabel = POSITION_LABELS[profile.position as keyof typeof POSITION_LABELS] ?? profile.position;
  const age = new Date().getFullYear() - (profile.birth_year ?? 2010);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0C0C0E",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #D4A853 0%, #F5D78E 50%, #D4A853 100%)",
          }}
        />

        {/* Player name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#FAFAFA",
            marginBottom: 16,
          }}
        >
          {profile.name}
        </div>

        {/* Position + Age + City */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 32,
            color: "#A1A1AA",
          }}
        >
          <span style={{ color: "#D4A853", fontWeight: 600 }}>{posLabel}</span>
          <span>만 {age}세</span>
          <span>{profile.city}</span>
        </div>

        {/* Level badge */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            color: lvl.color,
          }}
        >
          <span>{lvl.icon}</span>
          <span>Lv.{profile.level} {lvl.name}</span>
        </div>

        {/* Footory branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 24,
            color: "#71717A",
          }}
        >
          footory.app
        </div>
      </div>
    ),
    { ...size }
  );
}
