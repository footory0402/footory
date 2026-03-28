"use client";

interface PlayerMarkerProps {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  playerName: string;
  playerNumber?: string;
  onRemove?: () => void;
}

export default function PlayerMarker({ x, y, playerName, playerNumber, onRemove }: PlayerMarkerProps) {
  return (
    <div
      className="pointer-events-auto absolute z-10 flex flex-col items-center"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -100%)" }}
    >
      {/* 다이아몬드 */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
        className="h-5 w-5 rotate-45 bg-accent shadow-[0_0_20px_rgba(212,168,83,0.5),0_0_40px_rgba(212,168,83,0.2)]"
        aria-label="마커 제거"
      />
      {/* 수직선 */}
      <div className="h-6 w-0.5" style={{ background: "linear-gradient(to bottom, #D4A853, transparent)" }} />
      {/* 이름표 */}
      <div className="flex items-center gap-1.5 rounded bg-black/70 px-2.5 py-1" style={{ border: "1px solid rgba(212,168,83,0.4)" }}>
        <div className="h-1 w-1 rounded-full bg-black" />
        <span className="text-[11px] font-extrabold tracking-wide text-accent">{playerName}</span>
        {playerNumber && (
          <span className="text-[11px] font-semibold text-accent/50">#{playerNumber}</span>
        )}
      </div>
    </div>
  );
}
