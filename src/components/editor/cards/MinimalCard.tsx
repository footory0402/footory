import type { PlayerData } from "../types";
import { getClubColors } from "../utils";

export default function MinimalCard({ data }: { data: PlayerData }) {
  const club = getClubColors(data);

  const stats: [string, string][] = [
    ["생년월일", data.birthDate || "-"],
    ["나이", data.age || "-"],
    ["키", data.height ? `${data.height}cm` : "-"],
    ["몸무게", data.weight ? `${data.weight}kg` : "-"],
    ["주발", data.foot || "오른발"],
    ["국적", data.nationality || "대한민국"],
  ];

  return (
    <div
      className="relative w-[340px] overflow-hidden rounded-2xl bg-[#fafafa] font-[var(--font-body)]"
      style={{
        height: 440,
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${club.color}, ${club.accent})` }}
      />

      <div className="px-7 pt-7 text-center">
        {/* Photo */}
        <div
          className="mx-auto mb-4 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full"
          style={{
            background: "#f0f0f0",
            border: `3px solid ${club.accent}22`,
          }}
        >
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#ccc" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Position + Number */}
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[4px] text-[#999]">
          {data.position || "FORWARD"} · #{data.number || "9"}
        </div>

        {/* Name */}
        <div className="text-[28px] font-extrabold tracking-wide text-[#111]">
          {data.lastName || "성"}{data.firstName || "이름"}
        </div>

        {/* Club badge */}
        <div
          className="mt-2 inline-block rounded-full px-3.5 py-1 text-xs font-semibold"
          style={{
            background: `${club.accent}15`,
            color: club.color,
          }}
        >
          {data.club === "직접 입력" ? (data.customClubName || "MY TEAM") : (data.club || "FC Seoul U12")}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-7 my-4 h-px bg-[#eee]" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-0 px-7">
        {stats.map(([label, value], i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-[#999]">{label}</span>
            <span className="text-xs font-bold text-[#333]">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-7 right-7 text-center text-[9px] tracking-[2px] text-[#ccc]">
        FOOTORY.COM
      </div>
    </div>
  );
}
