import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Footory 팀 프로필";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("name, city")
    .eq("handle", handle)
    .single();

  if (!team) {
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

        {/* Team name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#FAFAFA",
            marginBottom: 16,
          }}
        >
          {team.name}
        </div>

        {/* Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 32,
            color: "#A1A1AA",
          }}
        >
          <span style={{ color: "#D4A853" }}>팀</span>
          {team.city && <span>{team.city}</span>}
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
