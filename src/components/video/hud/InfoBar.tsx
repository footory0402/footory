import type { HudPlayerData } from "./types";

/** 하단 스탯바 — CLUB | POSITION | BIRTH DATE | HEIGHT/WEIGHT | FOOT */
export default function InfoBar({ data }: { data: HudPlayerData }) {
  const clubFull = data.clubFull ?? data.club;
  const heightWeight = `${data.height || "-"}CM / ${data.weight || "-"}KG`;

  const items = [
    { label: "FOOTBALL CLUB", value: clubFull },
    { label: "POSITION", value: data.position },
    { label: "BIRTH DATE", value: data.birthDate || "-" },
    { label: "HEIGHT / WEIGHT", value: heightWeight },
    { label: "FOOT", value: data.foot },
  ];

  return (
    <div className="flex flex-1 items-center py-[clamp(2px,0.4vw,6px)]">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col items-center px-[clamp(2px,0.3vw,4px)] text-center"
          style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
        >
          <div
            className="font-semibold tracking-[1px] text-white/35"
            style={{ fontSize: "clamp(4px,0.55vw,7px)", marginBottom: 2 }}
          >
            {item.label}
          </div>
          <div
            className="font-bold tracking-[0.5px]"
            style={{ fontSize: "clamp(6px,0.8vw,10px)", color: data.accentColor }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
