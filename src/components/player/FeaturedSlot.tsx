"use client";

interface FeaturedSlotProps {
  clipId?: string;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  highlightStart?: number;
  highlightEnd?: number;
  sortOrder: number;
  onAdd: () => void;
  onRemove?: (clipId: string) => void;
}

export default function FeaturedSlot({
  clipId,
  thumbnailUrl,
  highlightStart,
  highlightEnd,
  sortOrder,
  onAdd,
  onRemove,
}: FeaturedSlotProps) {
  if (!clipId) {
    return (
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-accent)] bg-[var(--accent-bg)] p-4"
        style={{ aspectRatio: "16/10" }}
      >
        <span className="text-[20px]">✨</span>
        <span className="text-[11px] font-medium text-accent">
          대표 영상 {sortOrder} 추가
        </span>
      </button>
    );
  }

  const duration =
    highlightStart != null && highlightEnd != null
      ? highlightEnd - highlightStart
      : 30;

  return (
    <div className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: "16/10" }}>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-card)] text-2xl">
          🎬
        </div>
      )}

      {/* Duration badge */}
      <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {duration}s
      </div>

      {/* BEST badge */}
      {sortOrder === 1 && (
        <div className="absolute top-1.5 left-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-bg">
          BEST
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(clipId)}
          className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
