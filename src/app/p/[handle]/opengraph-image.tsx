import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { LEVELS } from "@/lib/constants";

export const runtime = "nodejs";
export const alt = "Footory 선수 프로필";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, handle, position, level, birth_year, city, avatar_url, mvp_count, mvp_tier, height_cm, weight_kg, preferred_foot")
    .eq("handle", handle)
    .single();

  // Team name
  let teamName: string | null = null;
  if (profile) {
    const { data: tm } = await supabase
      .from("team_members")
      .select("teams(name)")
      .eq("profile_id", (await supabase.from("profiles").select("id").eq("handle", handle).single()).data?.id ?? "")
      .eq("role", "member")
      .limit(1)
      .single();
    teamName = (tm as { teams: { name: string } } | null)?.teams?.name ?? null;
  }

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
            color: "#D4A853",
            fontSize: 48,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: "0.1em",
          }}
        >
          FOOTORY
        </div>
      ),
      { ...size }
    );
  }

  const lvl = LEVELS[Math.min(Math.max(profile.level, 1), 5) - 1];
  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null;
  const positionColors: Record<string, string> = {
    FW: "#F87171", MF: "#4ADE80", DF: "#60A5FA", GK: "#FBBF24",
  };
  const posColor = profile.position ? positionColors[profile.position] ?? "#A1A1AA" : "#A1A1AA";

  const physicalInfo = [
    profile.height_cm ? `${profile.height_cm}cm` : null,
    profile.weight_kg ? `${profile.weight_kg}kg` : null,
    profile.preferred_foot,
  ].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1a1510 0%, #0C0C0E 40%, #161618 60%, #1a1510 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold top line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 5,
            background: "linear-gradient(90deg, #8B6914, #D4A853, #F5D78E, #D4A853, #8B6914)",
          }}
        />

        {/* Gold radial glow */}
        <div
          style={{
            position: "absolute",
            top: -100, right: -100,
            width: 500, height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Card content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 56,
            padding: "60px 80px",
            width: "100%",
          }}
        >
          {/* Left: Avatar + Position */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 220, height: 220,
                borderRadius: "50%",
                border: "4px solid #D4A853",
                boxShadow: "0 0 30px rgba(212,168,83,0.2)",
                background: "#252528",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 88, color: "#71717A",
                overflow: "hidden",
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={220}
                  height={220}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              ) : (
                profile.name[0]
              )}
            </div>
            {profile.position && (
              <div
                style={{
                  padding: "6px 24px",
                  borderRadius: 8,
                  background: `${posColor}22`,
                  border: `2px solid ${posColor}55`,
                  color: posColor,
                  fontSize: 28, fontWeight: 700,
                }}
              >
                {profile.position}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
            <div style={{ fontSize: 52, fontWeight: 700, color: "#FAFAFA" }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 20, color: "#71717A" }}>
              @{profile.handle}
            </div>

            {/* Sub info */}
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 22, color: "#A1A1AA" }}>
              {age && <span>만 {age}세</span>}
              {teamName && <span style={{ color: "#D4A853" }}>{teamName}</span>}
            </div>

            {/* Physical */}
            {physicalInfo && (
              <div style={{ fontSize: 18, color: "#71717A", marginTop: 4 }}>
                {physicalInfo}
              </div>
            )}

            {/* Badges */}
            <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(212,168,83,0.08)",
                  border: "1px solid rgba(212,168,83,0.25)",
                  borderRadius: 12,
                  padding: "10px 20px",
                }}
              >
                <span style={{ fontSize: 24 }}>{lvl.icon}</span>
                <span style={{ fontSize: 22, color: "#D4A853", fontWeight: 700 }}>
                  Lv.{profile.level} {lvl.name}
                </span>
              </div>

              {profile.mvp_count > 0 && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(212,168,83,0.08)",
                    border: "1px solid rgba(212,168,83,0.25)",
                    borderRadius: 12,
                    padding: "10px 20px",
                  }}
                >
                  <span style={{ fontSize: 24 }}>🏆</span>
                  <span style={{ fontSize: 22, color: "#D4A853", fontWeight: 700 }}>
                    MVP x{profile.mvp_count}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 80px",
            borderTop: "1px solid #27272A",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: "#D4A853", letterSpacing: "0.1em" }}>
            FOOTORY
          </div>
          <div style={{ fontSize: 16, color: "#71717A" }}>
            footory.app/p/{profile.handle}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
