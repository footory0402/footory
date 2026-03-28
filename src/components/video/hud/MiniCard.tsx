import type { HudPlayerData } from "./types";

/** 좌하단 선수 미니카드 — 사진(좌) + 구단/이름/등번호/포지션(우) 가로 배치 */
export default function MiniCard({ data }: { data: HudPlayerData }) {
  const posShort = data.positionShort ?? data.position?.slice(0, 2).toUpperCase() ?? "FW";

  return (
    <div
      className="flex items-center gap-[clamp(4px,0.8vw,8px)] p-[clamp(4px,0.8vw,10px)]"
      style={{
        background: `linear-gradient(135deg, ${data.mainColor}cc, ${data.mainColor}44)`,
        borderRadius: "0 8px 0 0",
      }}
    >
      {/* Player photo — square */}
      <div
        className="flex shrink-0 items-center justify-center rounded-lg"
        style={{
          width: "clamp(28px,5vw,52px)",
          height: "clamp(28px,5vw,52px)",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <svg width="60%" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          </svg>
        )}
      </div>

      {/* Text info */}
      <div className="min-w-0">
        {/* Club name */}
        <div
          className="font-semibold tracking-[1px] text-white/50"
          style={{ fontSize: "clamp(5px,0.7vw,8px)" }}
        >
          {data.club}
        </div>

        {/* LAST FIRST + Number */}
        <div className="flex items-baseline gap-1">
          <span
            className="font-semibold"
            style={{ fontSize: "clamp(5px,0.6vw,7px)", color: data.accentColor }}
          >
            {data.firstName}
          </span>
          <span
            className="font-black text-white"
            style={{ fontSize: "clamp(10px,1.8vw,20px)" }}
          >
            {data.lastName}
          </span>
          <span
            className="font-black text-white/90"
            style={{ fontSize: "clamp(12px,2.2vw,26px)" }}
          >
            {data.number}
          </span>
        </div>

        {/* Position short */}
        <div
          className="font-semibold tracking-[1px]"
          style={{ fontSize: "clamp(4px,0.5vw,6px)", color: data.accentColor }}
        >
          {posShort}
        </div>
      </div>
    </div>
  );
}
