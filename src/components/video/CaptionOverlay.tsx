"use client";

import type { Caption } from "@/stores/upload-store";

interface CaptionOverlayProps {
  captions: Caption[];
  currentTime: number;  // trim 기준 상대 시간
}

const positionStyle: Record<Caption["position"], React.CSSProperties> = {
  top: { top: "calc(env(safe-area-inset-top, 16px) + 56px)", left: 0, right: 0 },
  center: { top: "50%", transform: "translateY(-50%)", left: 0, right: 0 },
  bottom: { bottom: "calc(env(safe-area-inset-bottom, 16px) + 72px)", left: 0, right: 0 },
};

function renderCaptionStyle(style: Caption["style"]): React.CSSProperties {
  switch (style) {
    case "sports":
      return {
        color: "#fff",
        fontFamily: "var(--font-stat)",
        fontWeight: 800,
        fontSize: "clamp(18px, 5vw, 28px)",
        textShadow: "2px 2px 0 rgba(0,0,0,0.9), -1px -1px 0 rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      };
    case "minimal":
      return {
        color: "#fff",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: "clamp(14px, 3.5vw, 20px)",
        background: "rgba(0,0,0,0.65)",
        padding: "6px 16px",
        borderRadius: "8px",
        backdropFilter: "blur(4px)",
      };
    case "gold":
      return {
        background: "linear-gradient(135deg, #D4A853 0%, #F5E6B8 50%, #D4A853 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontFamily: "var(--font-brand)",
        fontWeight: 700,
        fontSize: "clamp(18px, 5vw, 28px)",
        letterSpacing: "0.06em",
        filter: "drop-shadow(0 0 12px rgba(212,168,83,0.5))",
      };
  }
}

export default function CaptionOverlay({ captions, currentTime }: CaptionOverlayProps) {
  const visible = captions.filter(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  if (visible.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {visible.map((cap, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={positionStyle[cap.position]}
        >
          <span
            className="text-center px-3"
            style={{
              ...renderCaptionStyle(cap.style),
              animation: "caption-fade-in 0.3s ease-out",
            }}
          >
            {cap.text}
          </span>
        </div>
      ))}
    </div>
  );
}
