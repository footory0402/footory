import { STADIUM_BG } from "../constants";
import type { PlayerData } from "../types";
import { getClubColors } from "../utils";

export default function FifaCard({ data }: { data: PlayerData }) {
  const club = getClubColors(data);
  const shortClub = club.name.replace("U12", "").trim();

  return (
    <div
      className="relative overflow-hidden rounded-2xl font-[var(--font-body)]"
      style={{
        width: 380,
        height: 520,
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

      <div className="relative z-10 flex h-full flex-col p-5 px-6">
        {/* Top: Number + Position + Club badge */}
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
        <div className="mt-4 flex items-center gap-4">
          {/* Photo */}
          <div
            className="flex h-[130px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-full"
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
              {data.firstName || ""}
            </div>
            <div className="text-[28px] font-black uppercase leading-tight tracking-wider text-white">
              {data.lastName || "LAST"}
            </div>
            <div
              className="mt-1.5 inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide text-white"
              style={{ background: `${club.accent}33` }}
            >
              {data.club === "직접 입력" ? (data.customClubName || "MY TEAM") : (data.club || "FC Seoul U12")}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Player Info Grid */}
        <div
          className="grid gap-px overflow-hidden rounded-lg"
          style={{
            gridTemplateColumns: "1fr 1fr",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {[
            { label: "생년월일", value: data.birthDate || "-" },
            { label: "나이", value: data.age ? `${data.age}세` : "-" },
            { label: "키", value: data.height ? `${data.height}cm` : "-" },
            { label: "몸무게", value: data.weight ? `${data.weight}kg` : "-" },
            { label: "주발", value: data.foot || "-" },
            { label: "국적", value: data.nationality || "KOR" },
          ].map((item, i) => (
            <div
              key={i}
              className="px-3.5 py-2.5"
              style={{ background: "rgba(10,10,12,0.85)" }}
            >
              <div className="text-[8px] font-semibold uppercase tracking-[1.5px] text-white/30">
                {item.label}
              </div>
              <div
                className="mt-0.5 text-[12px] font-bold tracking-wide"
                style={{ color: club.accent }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 text-center text-[8px] tracking-[3px] text-white/20">
          FOOTORY.COM
        </div>
      </div>
    </div>
  );
}
