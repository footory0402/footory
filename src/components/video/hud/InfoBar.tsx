import type { HudPlayerData } from "./types";

/** 하단 정보바: CLUB | POSITION | BIRTH DATE | HEIGHT/WEIGHT | FOOT */
export default function InfoBar({ data }: { data: HudPlayerData }) {
  const items = [
    { label: "FOOTBALL CLUB", value: data.club },
    { label: "POSITION", value: data.position },
    { label: "BIRTH DATE", value: data.birthDate || "-" },
    { label: "HEIGHT / WEIGHT", value: `${data.height || "-"}CM / ${data.weight || "-"}KG` },
    { label: "FOOT", value: data.foot },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0">
      {/* Labels row */}
      <div className="flex">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-1 py-0.5 text-center text-[6px] font-semibold tracking-[1px] text-white/50"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            {item.label}
          </div>
        ))}
      </div>
      {/* Values row */}
      <div className="flex">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-1 py-1 text-center text-[8px] font-bold tracking-wide text-white"
            style={{
              background: i % 2 === 0 ? data.mainColor : "rgba(0,0,0,0.8)",
            }}
          >
            {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}
