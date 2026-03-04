interface VideoThumbProps {
  thumbnailUrl?: string;
  duration: number;
  tag?: string;
  aspectRatio?: "4/3" | "1/1" | "16/10";
  className?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoThumb({
  thumbnailUrl,
  duration,
  tag,
  aspectRatio = "16/10",
  className = "",
}: VideoThumbProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-lg bg-gradient-to-b from-[#1a1a1e] to-[#121214] ${className}`}
      style={{ aspectRatio }}
    >
      {/* Grass pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #D4A853 0px, transparent 1px, transparent 6px)",
        }}
      />

      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Duration */}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-stat text-[11px] font-medium text-white backdrop-blur-sm">
        {formatDuration(duration)}
      </span>

      {/* Tag */}
      {tag && (
        <span className="absolute top-1.5 right-1.5 rounded bg-accent/90 px-1.5 py-0.5 text-[9px] font-bold text-bg backdrop-blur-sm">
          {tag}
        </span>
      )}
    </div>
  );
}
