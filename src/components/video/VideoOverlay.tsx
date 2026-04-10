"use client";

/**
 * VideoOverlay — 영상 위 주인공 강조 오버레이
 *
 * 기본 상태: 오버레이 숨김
 * 프리즈 모드: EA-lite 브래킷과 이름 화살표를 1초 동안 노출
 *
 * pointer-events: none → 영상 컨트롤 방해 없음
 */

import {
  resolveHighlightVisualStyle,
  type HighlightVisualStyle,
} from "@/lib/highlight-visual";
import type { PlaybackEffects } from "@/lib/playback-focus";

interface VideoOverlayProps {
  spotlight: { x: number; y: number } | null;
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
  effects?: PlaybackEffects | null;
  hideNametag?: boolean;
  /** 프리즈 프레임 모드 — 강조 노출 */
  freezeMode?: boolean;
  zoomLevel?: number;
  showWhileZoom?: boolean;
  highlightStyle?: HighlightVisualStyle;
}

export default function VideoOverlay({
  spotlight,
  player,
  effects,
  hideNametag,
  freezeMode,
  zoomLevel = 1,
  showWhileZoom = false,
  highlightStyle,
}: VideoOverlayProps) {
  const resolvedStyle = resolveHighlightVisualStyle({
    effects,
    freezeMode,
    preferredStyle: highlightStyle,
  });
  const markerVisible = !!freezeMode || (showWhileZoom && zoomLevel > 1.05);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ willChange: "opacity" }}
    >
      {/* 시네마틱바 */}
      {effects?.cinematic && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[10%] bg-black" />
          <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black" />
        </>
      )}

      {/* ── 주인공 강조 라이트 ── */}
      {spotlight && (
        <div
          style={{
            position: "absolute",
            left: `${spotlight.x * 100}%`,
            top: `${spotlight.y * 100}%`,
            opacity: markerVisible ? 1 : 0,
            visibility: markerVisible ? "visible" : "hidden",
            transition: markerVisible
              ? "opacity 0.16s ease-out, visibility 0s"
              : "opacity 0.18s ease-out, visibility 0s 0.18s",
          }}
        >
          {resolvedStyle === "soft_ring" ? <SoftRing freezeMode={!!freezeMode} /> : null}
          {resolvedStyle === "double_ring" ? <DoubleRing freezeMode={!!freezeMode} /> : null}
          {resolvedStyle === "bracket_light" ? <BracketLight freezeMode={!!freezeMode} /> : null}

          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            >
            {!hideNametag && freezeMode && player.name ? (
              <FreezeNameIndicator name={player.name} effects={effects} />
            ) : null}

            <CenterMarker freezeMode={!!freezeMode} />
          </div>
        </div>
      )}
    </div>
  );
}

function FreezeNameIndicator({
  name,
  effects,
}: {
  name: string;
  effects?: PlaybackEffects | null;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 20px)",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: effects?.eafc
            ? "linear-gradient(180deg, rgba(32,24,10,0.96) 0%, rgba(12,12,14,0.96) 100%)"
            : "rgba(12,12,14,0.94)",
          border: "1px solid rgba(227,188,104,0.74)",
          borderRadius: 999,
          padding: "5px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.42)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "#FFF7E2",
            fontFamily: "var(--font-body, 'Noto Sans KR', sans-serif)",
          }}
        >
          {name}
        </span>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "14px solid rgba(227,188,104,0.96)",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.32))",
          marginTop: 4,
        }}
      />
    </div>
  );
}

function CenterMarker({ freezeMode }: { freezeMode: boolean }) {
  return (
    <div
      style={{
        width: freezeMode ? 52 : 46,
        height: freezeMode ? 52 : 46,
        borderRadius: "50%",
        border: freezeMode
          ? "1.5px solid rgba(255,235,189,0.9)"
          : "1.5px solid rgba(255,235,189,0.72)",
        boxShadow: freezeMode
          ? "0 0 0 6px rgba(212,168,83,0.12), 0 0 22px rgba(212,168,83,0.28)"
          : "0 0 0 4px rgba(212,168,83,0.08), 0 0 14px rgba(212,168,83,0.18)",
        background: "rgba(255,246,221,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        animation: freezeMode ? "broadcast-highlight-glow 0.9s ease-in-out infinite" : undefined,
      }}
    >
      <div
        style={{
          width: freezeMode ? 10 : 8,
          height: freezeMode ? 10 : 8,
          borderRadius: "50%",
          background: "#F8E7BD",
          boxShadow: "0 0 10px rgba(255,235,189,0.45)",
        }}
      />
    </div>
  );
}

function SoftRing({ freezeMode }: { freezeMode: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        width: freezeMode ? 108 : 96,
        height: freezeMode ? 108 : 96,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background: freezeMode
          ? "radial-gradient(circle, rgba(255,240,196,0.34) 0%, rgba(212,168,83,0.2) 34%, rgba(212,168,83,0.08) 58%, rgba(0,0,0,0) 78%)"
          : "radial-gradient(circle, rgba(255,241,208,0.24) 0%, rgba(212,168,83,0.14) 36%, rgba(212,168,83,0.05) 58%, rgba(0,0,0,0) 78%)",
        filter: freezeMode
          ? "drop-shadow(0 0 18px rgba(212,168,83,0.34))"
          : "drop-shadow(0 0 12px rgba(212,168,83,0.22))",
        animation: freezeMode
          ? "broadcast-highlight-glow 0.9s ease-in-out infinite"
          : "broadcast-circle-in 0.25s ease-out forwards",
      }}
    />
  );
}

function DoubleRing({ freezeMode }: { freezeMode: boolean }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: freezeMode ? 118 : 104,
          height: freezeMode ? 118 : 104,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(255,241,208,0.22) 0%, rgba(212,168,83,0.12) 36%, rgba(212,168,83,0.04) 62%, rgba(0,0,0,0) 80%)",
          filter: "drop-shadow(0 0 14px rgba(212,168,83,0.2))",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: freezeMode ? 86 : 76,
          height: freezeMode ? 86 : 76,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          border: "1px solid rgba(255,235,189,0.58)",
          boxShadow: "0 0 0 8px rgba(212,168,83,0.08)",
          animation: freezeMode ? "broadcast-highlight-glow 0.85s ease-in-out infinite" : undefined,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: freezeMode ? 60 : 54,
          height: freezeMode ? 60 : 54,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          border: "1px solid rgba(255,235,189,0.42)",
        }}
      />
    </>
  );
}

function BracketLight({ freezeMode }: { freezeMode: boolean }) {
  const bracketRadius = freezeMode ? 78 : 64;
  const segments = [
    { top: -bracketRadius / 2, left: -bracketRadius / 2, rotate: 0 },
    { top: -bracketRadius / 2, left: bracketRadius / 2 - 22, rotate: 90 },
    { top: bracketRadius / 2 - 22, left: bracketRadius / 2 - 22, rotate: 180 },
    { top: bracketRadius / 2 - 22, left: -bracketRadius / 2, rotate: 270 },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          width: freezeMode ? 118 : 96,
          height: freezeMode ? 118 : 96,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: freezeMode
            ? "radial-gradient(circle, rgba(255,241,208,0.24) 0%, rgba(212,168,83,0.12) 40%, rgba(0,0,0,0) 80%)"
            : "radial-gradient(circle, rgba(255,241,208,0.18) 0%, rgba(212,168,83,0.08) 40%, rgba(0,0,0,0) 78%)",
          filter: freezeMode
            ? "drop-shadow(0 0 18px rgba(212,168,83,0.24))"
            : "drop-shadow(0 0 12px rgba(212,168,83,0.18))",
        }}
      />
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: `calc(50% + ${segment.top}px)`,
            left: `calc(50% + ${segment.left}px)`,
            width: 22,
            height: 22,
            transform: `rotate(${segment.rotate}deg)`,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M2 20 L2 2 L20 2"
              stroke="rgba(255,235,189,0.88)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
