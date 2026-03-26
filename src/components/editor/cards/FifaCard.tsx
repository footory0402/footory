import { STADIUM_BG } from "../constants";
import { STAT_LABELS, type PlayerData, type PlayerStats } from "../types";
import { getClubColors } from "../utils";
import RadarChart from "./RadarChart";

const STAT_KEYS: (keyof PlayerStats)[] = [
  "pace", "shooting", "passing", "dribbling", "defense", "physical",
];

export default function FifaCard({ data }: { data: PlayerData }) {
  const club = getClubColors(data);
  const shortClub = club.name.replace("U12", "").trim();
  const overall = Math.round(
    STAT_KEYS.reduce((sum, k) => sum + data.stats[k], 0) / STAT_KEYS.length,
  );

  return (
    <div
      className="relative w-[380px] overflow-hidden rounded-2xl font-[var(--font-body)]"
      style={{
        height: 560,
        background: `linear-gradient(135deg, ${club.color} 0%, #0a0a0a 50%, ${club.accent}44 100%)`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Stadium BG */}
      <div
        className="absolute inset-0 opacity-15"
        style={{ background: `url("${STADIUM_BG}") center/cover` }}
      />
      {/* Accent glow */}
      <div
        className="absolute right-0 top-0 h-[120px] w-[120px]"
        style={{ background: `radial-gradient(circle at top right, ${club.accent}33, transparent 70%)` }}
      />

      <div className="relative z-10 p-5 px-6">
        {/* Top: Number + OVR + Position + Club badge */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="font-[var(--font-stat)] text-5xl font-black leading-none text-white"
              style={{ textShadow: `2px 2px 20px ${club.accent}66` }}
            >
              {data.number || "9"}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[3px] text-white/50">
              {data.position || "ST"}
            </div>
          </div>
          {/* Overall rating */}
          <div className="flex flex-col items-center">
            <div
              className="font-[var(--font-stat)] text-[42px] font-black leading-none"
              style={{ color: club.accent, textShadow: `0 0 20px ${club.accent}44` }}
            >
              {overall}
            </div>
            <div className="text-[8px] font-bold tracking-[2px] text-white/40">OVR</div>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-center text-[9px] font-bold leading-tight text-white"
            style={{
              background: `linear-gradient(135deg, ${club.color}, ${club.accent})`,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {shortClub}
          </div>
        </div>

        {/* Photo + Name row */}
        <div className="mt-3 flex items-center gap-4">
          {/* Photo */}
          <div
            className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              border: `2px solid ${club.accent}44`,
            }}
          >
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          {/* Name */}
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium uppercase tracking-[5px] text-white/40">
              {data.firstName || "FIRST"}
            </div>
            <div className="text-[28px] font-black uppercase leading-tight tracking-wider text-white">
              {data.lastName || "LAST"}
            </div>
            <div
              className="mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide text-white"
              style={{ background: `${club.accent}33` }}
            >
              {data.club || "FC Seoul U12"}
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="mt-3 flex items-center justify-center">
          <RadarChart stats={data.stats} accentColor={club.accent} size={180} />
        </div>

        {/* Stat bars — compact */}
        <div className="mt-1 grid grid-cols-3 gap-x-4 gap-y-1 px-2">
          {STAT_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-7 text-[8px] font-bold tracking-wide text-white/40">
                {STAT_LABELS[key].en}
              </span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${data.stats[key]}%`,
                    background: `linear-gradient(90deg, ${club.color}, ${club.accent})`,
                  }}
                />
              </div>
              <span className="w-5 text-right text-[9px] font-bold" style={{ color: club.accent }}>
                {data.stats[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom info row */}
        <div
          className="mt-3 grid rounded-lg py-2"
          style={{
            gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { label: "AGE", value: data.age || "-" },
            null,
            { label: "HEIGHT", value: data.height ? `${data.height}cm` : "-" },
            null,
            { label: "FOOT", value: data.foot || "-" },
            null,
            { label: "NAT", value: data.nationality || "KOR" },
          ].map((item, i) =>
            item ? (
              <div key={i} className="px-1.5 text-center">
                <div className="text-[7px] font-semibold tracking-[1.5px] text-white/30">{item.label}</div>
                <div className="mt-0.5 text-[10px] font-bold tracking-wide" style={{ color: club.accent }}>
                  {item.value}
                </div>
              </div>
            ) : (
              <div key={i} className="bg-white/6" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
