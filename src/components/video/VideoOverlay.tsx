"use client";

/**
 * VideoOverlay — 스포트라이트 링 + EA FC 네임태그 오버레이
 *
 * 영상 재생 시작 1초 동안 표시 후 페이드아웃.
 * key prop 변경으로 애니메이션 리트리거 (재생할 때마다 새 key 전달).
 * pointer-events: none → 영상 컨트롤 방해 없음.
 *
 * effects?.cinematic: 상하단 레터박스 (h-[10%] 검정 바)
 * effects?.eafc: 네임태그 골드 강화 스타일
 */

interface VideoOverlayProps {
  spotlight: { x: number; y: number } | null; // null이면 링 숨김, 네임태그만
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
  effects?: {
    eafc?: boolean;      // EA FC 카드 스타일 네임태그 강화
    cinematic?: boolean; // 시네마틱바 (상하단 검정 레터박스)
    intro?: boolean;     // 인트로 애니메이션 (이미 동작 중)
  } | null;
  /** HUD 오버레이가 있으면 네임태그 숨김 (스포트라이트 링만 표시) */
  hideNametag?: boolean;
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

export default function VideoOverlay({ spotlight, player, effects, hideNametag }: VideoOverlayProps) {
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
      {/* 시네마틱바 (effects.cinematic) — 상하단 레터박스 */}
      {effects?.cinematic && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[10%] bg-black" />
          <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black" />
        </>
      )}

      {/* 스포트라이트 링 — spotlight이 null이면 숨김 */}
      {spotlight && (
        <div
          className="absolute"
          style={{
            left: `${spotlight.x * 100}%`,
            top: `${spotlight.y * 100}%`,
            transform: "translate(-50%, -50%)",
            animation: "overlay-ring-in 0.2s ease-out forwards, overlay-fadeout 0.3s ease-in 2.5s forwards",
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
              animation: "overlay-pulse 0.8s ease-out 0.6s forwards",
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
      )}

      {/* 네임태그 카드 — 하단 중앙 (HUD 있으면 숨김) */}
      {!hideNametag && <div
        className="absolute bottom-36"
        style={{
          left: "50%",
          width: "90%",
          maxWidth: 400,
          animation: "overlay-nametag-in 0.2s ease-out 0.2s both, overlay-fadeout 0.3s ease-in 2.5s forwards",
        }}
      >
        <div
          style={{
            background: effects?.eafc
              ? "linear-gradient(135deg, rgba(30,20,5,0.96) 0%, rgba(15,15,18,0.96) 100%)"
              : "rgba(15,15,18,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: effects?.eafc
              ? "1.5px solid rgba(212,168,83,0.6)"
              : "1.5px solid rgba(212,168,83,0.35)",
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            animation: "overlay-fadeout 0.3s ease-in 2.5s forwards",
            boxShadow: effects?.eafc
              ? "0 4px 20px rgba(212,168,83,0.15), inset 0 1px 0 rgba(212,168,83,0.1)"
              : undefined,
          }}
        >
          {/* 팀 배지 */}
          {player.teamName && (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: effects?.eafc
                  ? "linear-gradient(135deg, #D4A853 0%, #C49040 50%, #A07830 100%)"
                  : "linear-gradient(135deg, #D4A853 0%, #A07830 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#0A0A0C",
                letterSpacing: "-0.5px",
                boxShadow: effects?.eafc
                  ? "0 0 8px rgba(212,168,83,0.4)"
                  : undefined,
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
                fontSize: effects?.eafc ? 20 : 18,
                fontWeight: effects?.eafc ? 800 : 700,
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
                  fontSize: 14,
                  color: effects?.eafc ? "#D4A853" : "#A1A1AA",
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
      </div>}
    </div>
  );
}
