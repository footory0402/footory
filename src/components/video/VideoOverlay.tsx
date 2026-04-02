"use client";

/**
 * VideoOverlay — 축구 중계 스타일 선수 마커 오버레이
 *
 * 1x 전체뷰: 마커 + 라벨 영상 전체 상시 표시 (무한 float)
 * 2x 이상 줌: 마커가 1.5초 후 자동 fadeout (확대 상태엔 선수가 크게 보여 불필요)
 * 프리즈 모드: scale 1.2 + glow 강화
 *
 * pointer-events: none → 영상 컨트롤 방해 없음
 */

import { useEffect, useRef, useState } from "react";

interface VideoOverlayProps {
  spotlight: { x: number; y: number } | null;
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
  effects?: {
    eafc?: boolean;
    cinematic?: boolean;
    intro?: boolean;
  } | null;
  hideNametag?: boolean;
  /** 프리즈 프레임 모드 — glow 강화 */
  freezeMode?: boolean;
  /** 현재 줌 레벨 — 2 이상이면 1.5초 후 마커 fadeout */
  zoomLevel?: number;
}

export default function VideoOverlay({
  spotlight,
  player,
  effects,
  hideNametag,
  freezeMode,
  zoomLevel = 1,
}: VideoOverlayProps) {
  const [markerVisible, setMarkerVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevZoomRef = useRef(zoomLevel);

  // 줌 레벨 변화 감지: 1x→2x+ 전환 시 1.5초 후 fadeout, 2x+→1x 전환 시 마커 재표시
  useEffect(() => {
    const wasZoomed = prevZoomRef.current >= 2;
    const isZoomed = zoomLevel >= 2;
    prevZoomRef.current = zoomLevel;

    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    if (isZoomed) {
      // 줌 상태: 1.5초 후 마커 숨김
      setMarkerVisible(true); // 전환 순간엔 잠깐 보여줌
      fadeTimerRef.current = setTimeout(() => setMarkerVisible(false), 1500);
    } else if (wasZoomed && !isZoomed) {
      // 줌 해제: 즉시 마커 재표시
      setMarkerVisible(true);
    }

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [zoomLevel]);

  const infoChunks: string[] = [];
  if (player.position) infoChunks.push(player.position);
  if (player.birthYear) {
    const age = new Date().getFullYear() - player.birthYear;
    infoChunks.push(`U${age}`);
  }
  const infoLine = infoChunks.join(" · ");

  const isZoomed = zoomLevel >= 2;

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

      {/* ── 축구 중계 스타일 마커 ── */}
      {spotlight && (
        <div
          style={{
            position: "absolute",
            left: `${spotlight.x * 100}%`,
            top: `${spotlight.y * 100}%`,
            opacity: markerVisible ? 1 : 0,
            visibility: markerVisible ? "visible" : "hidden",
            transition: markerVisible ? "opacity 0s, visibility 0s" : "opacity 0.4s ease-out, visibility 0s 0.4s",
          }}
        >
          {/* 반투명 원형 하이라이트 (선수 영역 강조) */}
          <div
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(212,168,83,0.18) 0%, rgba(212,168,83,0.06) 50%, transparent 75%)",
              animation: "broadcast-circle-in 0.3s ease-out forwards",
              animationDelay: "0.1s",
              opacity: 0,
            }}
          />

          {/* 하향 삼각형 마커 (위에서 떨어지는 진입 → 무한 float) */}
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, calc(-100% - 8px))",
              animation: freezeMode
                ? "broadcast-drop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards"
                : "broadcast-drop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards, broadcast-float 1.8s ease-in-out 0.5s infinite",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* 컴팩트 라벨 (마커 위) */}
            {!hideNametag && (
              <div
                style={{
                  background: effects?.eafc
                    ? "linear-gradient(135deg, rgba(30,20,5,0.95) 0%, rgba(15,15,18,0.95) 100%)"
                    : "rgba(10,10,14,0.88)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: effects?.eafc
                    ? "1px solid rgba(212,168,83,0.55)"
                    : "1px solid rgba(212,168,83,0.3)",
                  borderRadius: 20,
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 5,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {/* 팀 뱃지 (있을 때만) */}
                {player.teamName && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #D4A853 0%, #A07830 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      color: "#0A0A0C",
                      flexShrink: 0,
                    }}
                  >
                    {player.teamName.trim()[0]}
                  </div>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    fontFamily: "var(--font-body, 'Noto Sans KR', sans-serif)",
                  }}
                >
                  {player.name}
                </span>
                {infoLine && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#D4A853",
                      fontWeight: 500,
                    }}
                  >
                    {infoLine}
                  </span>
                )}
              </div>
            )}

            {/* 삼각형 SVG */}
            <svg
              width="22"
              height="14"
              viewBox="0 0 22 14"
              style={{
                filter: freezeMode
                  ? "drop-shadow(0 0 8px rgba(212,168,83,0.9)) drop-shadow(0 0 16px rgba(212,168,83,0.5))"
                  : "drop-shadow(0 0 5px rgba(212,168,83,0.7))",
                transform: freezeMode ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.2s ease, filter 0.2s ease",
              }}
            >
              <polygon
                points="11,14 0,0 22,0"
                fill="#D4A853"
                fillOpacity={freezeMode ? 1 : 0.95}
              />
            </svg>
          </div>

          {/* 프리즈 모드: 원형 glow 펄스 */}
          {freezeMode && (
            <div
              style={{
                position: "absolute",
                width: 56,
                height: 56,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                border: "2px solid rgba(212,168,83,0.7)",
                animation: "broadcast-highlight-glow 0.8s ease-in-out infinite",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
