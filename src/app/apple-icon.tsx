import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C0C0E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, #D4A853, transparent)",
          }}
        />

        {/* Soccer pentagon shapes - decorative background */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "14px",
            width: "22px",
            height: "20px",
            background: "#D4A853",
            opacity: 0.15,
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "18px",
            right: "16px",
            width: "16px",
            height: "15px",
            background: "#D4A853",
            opacity: 0.12,
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          }}
        />

        {/* Main "F" letterform */}
        <span
          style={{
            color: "#D4A853",
            fontSize: "110px",
            fontWeight: 900,
            fontFamily: "Impact, Arial Black, sans-serif",
            lineHeight: 1,
            letterSpacing: "-4px",
          }}
        >
          F
        </span>

        {/* OOTORY in smaller text - together spells FOOTORY */}
        <span
          style={{
            color: "#D4A853",
            fontSize: "17px",
            fontWeight: 700,
            fontFamily: "Arial, sans-serif",
            letterSpacing: "5px",
            opacity: 0.75,
            marginTop: "-4px",
          }}
        >
          OOTORY
        </span>
      </div>
    ),
    { ...size },
  );
}
