import { STADIUM_BG } from "../constants";
import { STAT_LABELS, type PlayerData, type PlayerStats } from "../types";
import { getClubColors } from "../utils";
import RadarChart from "./RadarChart";

const STAT_KEYS: (keyof PlayerStats)[] = [
  "pace", "shooting", "passing", "dribbling", "defense", "physical",
];

export default function BroadcastCard({ data }: { data: PlayerData }) {
  const club = getClubColors(data);
  const overall = Math.round(
    STAT_KEYS.reduce((sum, k) => sum + data.stats[k], 0) / STAT_KEYS.length,
  );

  const infoRows: [string, string][] = [
    ["NAME", `${data.lastName || "LAST"} ${data.firstName || "FIRST"}`],
    ["NUMBER", data.number || "9"],
    ["POSITION", data.position || "ST"],
    ["CLUB", data.club || "FC Seoul U12"],
    ["BIRTH", data.birthDate || "-"],
  ];

  return (
    <div
      className="relative overflow-hidden rounded-xl font-[var(--font-body)]"
      style={{
        width: 640,
        height: 360,
        background: `linear-gradient(135deg, #0a0a0a 0%, ${club.color}44 100%)`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Stadium BG */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: `url("${STADIUM_BG}") center/cover` }}
      />
      {/* Right accent gradient */}
      <div
        className="absolute right-0 top-0 h-full w-[40%]"
        style={{ background: `linear-gradient(90deg, transparent, ${club.color}33)` }}
      />

      <div className="relative z-10 flex h-full">
        {/* Left: Player Photo */}
        <div className="flex w-[180px] items-end pl-6">
          <div
            className="flex h-[240px] w-[155px] items-end justify-center overflow-hidden rounded-t-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
            }}
          >
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg width="70" height="90" viewBox="0 0 24 28" fill="none" className="mb-2.5">
                <circle cx="12" cy="8" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              </svg>
            )}
          </div>
        </div>

        {/* Center: Info */}
        <div className="flex w-[240px] flex-col justify-between py-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-block rounded px-3 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-white"
                style={{ background: club.accent }}
              >
                PLAYER REVIEW
              </span>
              <span
                className="font-[var(--font-stat)] text-2xl font-black"
                style={{ color: club.accent }}
              >
                {overall}
              </span>
            </div>
            <div className="mb-0.5 text-xs font-medium uppercase tracking-[4px] text-white/50">
              {data.firstName || "FIRST"}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-[var(--font-stat)] text-3xl font-black uppercase tracking-wider text-white">
                {data.lastName || "LAST"}
              </span>
              <span className="font-[var(--font-stat)] text-[44px] font-black leading-none text-white/10">
                {data.number || "9"}
              </span>
            </div>
          </div>

          {/* Data rows */}
          <div className="flex flex-col gap-1">
            {infoRows.map(([label, value], i) => (
              <div key={i} className="flex h-[24px] items-center text-[11px]">
                <span className="w-16 text-[9px] font-semibold tracking-[2px] text-white/35">
                  {label}
                </span>
                <span
                  className="flex-1 rounded px-3 py-0.5 font-bold tracking-wide"
                  style={{
                    background: i % 2 === 0 ? `${club.accent}22` : "rgba(255,255,255,0.04)",
                    color: i % 2 === 0 ? club.accent : "rgba(255,255,255,0.7)",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Radar Chart */}
        <div className="flex flex-1 flex-col items-center justify-center pr-4">
          <RadarChart stats={data.stats} accentColor={club.accent} size={160} />
          {/* Stat numbers below radar */}
          <div className="mt-1 grid grid-cols-3 gap-x-3 gap-y-0.5">
            {STAT_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-1">
                <span className="text-[7px] font-bold tracking-wide text-white/35">
                  {STAT_LABELS[key].en}
                </span>
                <span className="text-[9px] font-bold" style={{ color: club.accent }}>
                  {data.stats[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${club.color}, ${club.accent}, ${club.color})` }}
      />
    </div>
  );
}
