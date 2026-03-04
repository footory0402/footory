import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C0C0E",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px",
        }}
      >
        {/* Gold "F" with slight soccer accent dot */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Small gold dot (soccer ball motif) */}
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-4px",
              width: "6px",
              height: "6px",
              background: "#D4A853",
              borderRadius: "50%",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              color: "#D4A853",
              fontSize: "22px",
              fontWeight: 900,
              fontFamily: "Impact, Arial Black, sans-serif",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            F
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
