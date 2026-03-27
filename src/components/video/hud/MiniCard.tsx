import type { HudPlayerData } from "./types";

/** 좌하단 선수 미니카드: 사진 + 구단명 + 이름 + 등번호 */
export default function MiniCard({ data }: { data: HudPlayerData }) {
  return (
    <div className="absolute bottom-12 left-3 flex w-[120px] flex-col overflow-hidden rounded-lg shadow-xl">
      {/* Photo */}
      <div className="relative h-[72px] w-full bg-black/60">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {/* Club strip */}
        <div
          className="absolute inset-x-0 bottom-0 py-0.5 text-center text-[7px] font-bold tracking-[1px] text-white"
          style={{ background: data.mainColor }}
        >
          {data.club}
        </div>
      </div>
      {/* Name + Number */}
      <div className="flex items-baseline gap-1 bg-black/80 px-2 py-1.5">
        <span className="font-[var(--font-stat)] text-[16px] font-black leading-none text-white">
          {data.lastName}
        </span>
        <span className="font-[var(--font-stat)] text-[20px] font-black leading-none" style={{ color: data.accentColor }}>
          {data.number}
        </span>
      </div>
    </div>
  );
}
