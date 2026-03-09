import Image from "next/image";

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
      className={`group relative overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.03] ${className}`}
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
        <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 430px) 50vw, 200px" className="object-cover" />
      )}

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Duration */}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-stat text-[10px] font-medium text-white backdrop-blur-sm">
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
