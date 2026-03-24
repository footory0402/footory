"use client";

/**
 * VideoOverlay — 스포트라이트 링 + EA FC 네임태그 오버레이
 *
 * 영상 재생 시작 1초 동안 표시 후 페이드아웃.
 * key prop 변경으로 애니메이션 리트리거 (재생할 때마다 새 key 전달).
 * pointer-events: none → 영상 컨트롤 방해 없음.
 */

interface VideoOverlayProps {
  spotlight: { x: number; y: number };
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
}

function calcAgeGroup(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  return `U${age}`;
}

function getTeamInitial(teamName: string): string {
  // "서울 FC" → "서울", "광주" → "광", 최대 2글자
  const parts = teamName.trim().split(/\s+/);
  return parts[0].slice(0, 2);
}

export default function VideoOverlay({ spotlight, player }: VideoOverlayProps) {
  const { x, y } = spotlight;

  const infoChunks: string[] = [];
  if (player.position) infoChunks.push(player.position);
  if (player.birthYear) infoChunks.push(calcAgeGroup(player.birthYear));
  if (player.teamName) infoChunks.push(player.teamName);
  const infoLine = infoChunks.join(" · ");

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ willChange: "opacity" }}
    >
      {/* 스포트라이트 링 — 0.2s 등장 후 0.8s에 페이드아웃 */}
      <div
        className="absolute"
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          animation: "overlay-ring-in 0.2s ease-out forwards, overlay-fadeout 0.2s ease-in 0.8s forwards",
        }}
      >
        {/* 링 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3.5px solid #D4A853",
            background:
              "radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)",
            boxShadow:
              "0 0 0 0 rgba(212,168,83,0.4), 0 0 16px rgba(212,168,83,0.3)",
            animation: "overlay-pulse 0.8s ease-out 0.8s forwards",
          }}
        />

        {/* ▼ 화살표 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translateX(-50%)",
            marginTop: 4,
            color: "#D4A853",
            fontSize: 12,
            filter: "drop-shadow(0 0 4px rgba(212,168,83,0.6))",
            animation: "overlay-bounce 0.6s ease-in-out 0.2s",
          }}
        >
          ▼
        </div>
      </div>

      {/* 네임태그 카드 — 하단 중앙 */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        style={{
          width: "82%",
          maxWidth: 320,
          animation: "overlay-nametag-in 0.2s ease-out 0.2s both",
        }}
      >
        <div
          style={{
            background: "rgba(15,15,18,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(212,168,83,0.35)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "overlay-fadeout 0.2s ease-in 0.8s forwards",
          }}
        >
          {/* 팀 배지 */}
          {player.teamName && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #D4A853 0%, #A07830 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#0A0A0C",
                letterSpacing: "-0.5px",
              }}
            >
              {getTeamInitial(player.teamName)}
            </div>
          )}

          {/* 텍스트 */}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-body, 'Noto Sans KR', sans-serif)",
                fontSize: 15,
                fontWeight: 700,
                color: "#FAFAFA",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {player.name}
            </p>
            {infoLine && (
              <p
                style={{
                  fontSize: 11,
                  color: "#A1A1AA",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {infoLine}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
