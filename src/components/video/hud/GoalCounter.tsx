import type { HudPlayerData } from "./types";

interface Props {
  data: HudPlayerData;
  goalCount: number;
}

/** 우하단 — GOAL 뱃지 + 포메이션 다이어그램 + 구단 로고 */
export default function GoalCounter({ data, goalCount }: Props) {
  const clubDisplay = data.club.replace(/\s*U\d+/, "").substring(0, 4);

  return (
    <div
      className="flex flex-col items-center justify-center gap-[clamp(2px,0.3vw,4px)] p-[clamp(2px,0.4vw,6px)]"
      style={{ width: "15%" }}
    >
      {/* GOAL badge */}
      <div
        className="font-black text-white"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "clamp(1px,0.2vw,3px) clamp(6px,1vw,12px)",
          fontSize: "clamp(6px,0.8vw,10px)",
          letterSpacing: 3,
        }}
      >
        G O A L
      </div>

      {/* Goal count */}
      <div
        className="font-[var(--font-stat)] font-black leading-none"
        style={{ fontSize: "clamp(14px,2.5vw,28px)", color: data.accentColor }}
      >
        {goalCount}
      </div>

      {/* Formation diagram */}
      <FormationDiagram data={data} />

      {/* Club logo */}
      <div
        className="flex items-center justify-center rounded-full font-black text-white"
        style={{
          width: "clamp(14px,2vw,22px)",
          height: "clamp(14px,2vw,22px)",
          background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor})`,
          fontSize: "clamp(4px,0.5vw,6px)",
        }}
      >
        {clubDisplay}
      </div>
    </div>
  );
}

/** 포메이션 미니 다이어그램 — SVG 사다리꼴 필드 + 선수 dot */
function FormationDiagram({ data }: { data: HudPlayerData }) {
  // 4-3-3 기본 포메이션 dot (x, y in viewBox 0 0 70 40)
  const teamDots = [
    { x: 35, y: 6 },   // FW (주인공)
    { x: 20, y: 6 },   // FW
    { x: 50, y: 6 },   // FW
    { x: 17, y: 18 },  // MF
    { x: 35, y: 18 },  // MF
    { x: 53, y: 18 },  // MF
    { x: 10, y: 30 },  // DF
    { x: 27, y: 30 },  // DF
    { x: 43, y: 30 },  // DF
    { x: 60, y: 30 },  // DF
    { x: 35, y: 38 },  // GK
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "clamp(40px,6vw,70px)", height: "clamp(24px,3.5vw,40px)" }}
    >
      <svg width="100%" height="100%" viewBox="0 0 70 40">
        {/* Field outline (trapezoid) */}
        <path
          d="M10 40 L0 0 L70 0 L60 40 Z"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        <line x1="35" y1="0" x2="35" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Team dots */}
        {teamDots.map((dot, i) => {
          const isPlayer = i === 0; // 주인공 dot
          return (
            <g key={i}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={isPlayer ? 3.5 : 2.5}
                fill={isPlayer ? data.accentColor : "rgba(255,255,255,0.45)"}
                opacity={isPlayer ? 1 : 0.9}
              />
              {isPlayer && (
                <text
                  x={dot.x}
                  y={dot.y + 1.5}
                  textAnchor="middle"
                  fontSize="4"
                  fill="#fff"
                  fontWeight="700"
                >
                  {data.number}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
