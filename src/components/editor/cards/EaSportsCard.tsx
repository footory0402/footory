import { STADIUM_BG } from "../constants";
import type { PlayerData } from "../types";
import { getClubColors } from "../utils";

export default function EaSportsCard({ data }: { data: PlayerData }) {
  const club = getClubColors(data);
  const displayName = data.name || "PLAYER";
  const clubName = data.club === "직접 입력"
    ? (data.customClubName || "MY TEAM")
    : (data.club || "FC Seoul U12");

  return (
    <div
      className="relative overflow-hidden rounded-2xl font-[var(--font-body)]"
      style={{
        width: 360,
        height: 520,
        background: `linear-gradient(160deg, ${club.color} 0%, ${club.color}cc 40%, #0a0a0c 100%)`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Stadium BG */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: `url("${STADIUM_BG}") center/cover` }}
      />

      {/* Diagonal accent stripe */}
      <div
        className="absolute -right-20 -top-20 h-[300px] w-[200px] rotate-[25deg]"
        style={{ background: `linear-gradient(180deg, ${club.accent}40, transparent)` }}
      />

      {/* Top section: Rating + Position + Club */}
      <div className="relative z-10 flex items-start justify-between px-5 pt-5">
        {/* Left: OVR + Position */}
        <div className="flex flex-col items-center">
          <span
            className="font-[var(--font-stat)] text-[48px] font-black leading-none"
            style={{ color: club.accent, textShadow: `0 2px 12px ${club.accent}60` }}
          >
            {data.number || "9"}
          </span>
          <span
            className="mt-0.5 text-[13px] font-bold tracking-widest"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {data.position || "ST"}
          </span>
          {/* Country flag placeholder */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <span className="text-[9px] font-semibold tracking-[2px] text-white/40">
              {data.nationality || "KOR"}
            </span>
            <div
              className="h-[2px] w-5 rounded-full"
              style={{ background: club.accent }}
            />
            <span className="text-[9px] font-semibold tracking-[1px] text-white/40">
              {clubName.replace(/ U\d+/, "").slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Right: Club badge area */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-black text-white/80"
          style={{
            background: `linear-gradient(135deg, ${club.accent}80, ${club.color}80)`,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          F
        </div>
      </div>

      {/* Player Photo */}
      <div className="relative z-10 flex justify-center -mt-2">
        <div
          className="flex h-[220px] w-[200px] items-end justify-center overflow-hidden"
        >
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
              style={{
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
              }}
            />
          ) : (
            <svg width="100" height="120" viewBox="0 0 24 28" fill="none" className="mb-4">
              <circle cx="12" cy="8" r="5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      </div>

      {/* Name bar */}
      <div
        className="relative z-10 mx-4 -mt-1 rounded-lg px-4 py-2 text-center"
        style={{
          background: `linear-gradient(90deg, transparent, ${club.accent}30, transparent)`,
          borderTop: `2px solid ${club.accent}60`,
        }}
      >
        <div
          className="font-[var(--font-stat)] text-[24px] font-black tracking-wider uppercase"
          style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          {displayName}
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative z-10 mx-5 mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5">
        {([
          ["AGE", data.age ? `${data.age}` : "-"],
          ["HEIGHT", data.height ? `${data.height}` : "-"],
          ["WEIGHT", data.weight ? `${data.weight}` : "-"],
          ["FOOT", data.foot || "-"],
          ["BIRTH", data.birthDate?.slice(0, 4) || "-"],
          ["CLUB", clubName.replace(/ U\d+/, "").slice(0, 6)],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex flex-col items-center">
            <span
              className="font-[var(--font-stat)] text-[18px] font-bold leading-tight"
              style={{ color: "white" }}
            >
              {value}
            </span>
            <span className="text-[7px] font-semibold tracking-[2px] text-white/35">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[4px]"
        style={{ background: `linear-gradient(90deg, ${club.color}, ${club.accent}, ${club.color})` }}
      />
    </div>
  );
}
