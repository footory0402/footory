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
          <FocusIsolation freezeMode={!!freezeMode} active={markerVisible} />
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
            {freezeMode ? <FreezeChevron /> : null}
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

function FocusIsolation({ freezeMode, active }: { freezeMode: boolean; active: boolean }) {
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        width: freezeMode ? 240 : 196,
        height: freezeMode ? 240 : 196,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background: freezeMode
          ? "radial-gradient(circle, rgba(255,244,214,0.18) 0%, rgba(212,168,83,0.14) 24%, rgba(212,168,83,0.06) 40%, rgba(0,0,0,0.32) 66%, rgba(0,0,0,0) 82%)"
          : "radial-gradient(circle, rgba(255,244,214,0.1) 0%, rgba(212,168,83,0.08) 24%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0) 80%)",
        mixBlendMode: "screen",
        filter: freezeMode
          ? "drop-shadow(0 0 28px rgba(212,168,83,0.22))"
          : "drop-shadow(0 0 18px rgba(212,168,83,0.14))",
      }}
    />
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
        bottom: "calc(100% + 30px)",
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
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: effects?.eafc
            ? "linear-gradient(180deg, rgba(32,24,10,0.96) 0%, rgba(12,12,14,0.96) 100%)"
            : "rgba(12,12,14,0.94)",
          border: "1px solid rgba(227,188,104,0.74)",
          borderRadius: 999,
          padding: "6px 14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.48)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            fontSize: 13,
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
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderTop: "16px solid rgba(227,188,104,0.98)",
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.34))",
          marginTop: 5,
        }}
      />
    </div>
  );
}

function CenterMarker({ freezeMode }: { freezeMode: boolean }) {
  return (
    <div
      style={{
        width: freezeMode ? 58 : 48,
        height: freezeMode ? 58 : 48,
        borderRadius: "50%",
        border: freezeMode
          ? "1.5px solid rgba(255,235,189,0.96)"
          : "1.5px solid rgba(255,235,189,0.72)",
        boxShadow: freezeMode
          ? "0 0 0 8px rgba(212,168,83,0.14), 0 0 28px rgba(212,168,83,0.34)"
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
          width: freezeMode ? 12 : 8,
          height: freezeMode ? 12 : 8,
          borderRadius: "50%",
          background: "#F8E7BD",
          boxShadow: "0 0 14px rgba(255,235,189,0.5)",
        }}
      />
    </div>
  );
}

function FreezeChevron() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 74px)",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.3))",
      }}
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          style={{
            width: 0,
            height: 0,
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderTop: "18px solid rgba(255,228,168,0.98)",
            opacity: index === 0 ? 1 : 0.72,
          }}
        />
      ))}
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
  const bracketRadius = freezeMode ? 92 : 72;
  const segments = [
    { top: -bracketRadius / 2, left: -bracketRadius / 2, rotate: 0 },
    { top: -bracketRadius / 2, left: bracketRadius / 2 - 28, rotate: 90 },
    { top: bracketRadius / 2 - 28, left: bracketRadius / 2 - 28, rotate: 180 },
    { top: bracketRadius / 2 - 22, left: -bracketRadius / 2, rotate: 270 },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          width: freezeMode ? 138 : 110,
          height: freezeMode ? 138 : 110,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: freezeMode
            ? "radial-gradient(circle, rgba(255,241,208,0.28) 0%, rgba(212,168,83,0.16) 38%, rgba(0,0,0,0) 80%)"
            : "radial-gradient(circle, rgba(255,241,208,0.18) 0%, rgba(212,168,83,0.08) 40%, rgba(0,0,0,0) 78%)",
          filter: freezeMode
            ? "drop-shadow(0 0 24px rgba(212,168,83,0.28))"
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
            width: freezeMode ? 28 : 24,
            height: freezeMode ? 28 : 24,
            transform: `rotate(${segment.rotate}deg)`,
          }}
        >
          <svg
            width={freezeMode ? 28 : 24}
            height={freezeMode ? 28 : 24}
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M2.5 25.5 L2.5 2.5 L25.5 2.5"
              stroke={freezeMode ? "rgba(255,235,189,0.98)" : "rgba(255,235,189,0.88)"}
              strokeWidth={freezeMode ? "2.4" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
