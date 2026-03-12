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
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Thumbnail */}
      <div
        className="group relative overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.03]"
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

        {/* Play button — min 44px touch target */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration — bottom center */}
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 font-stat text-[10px] font-medium text-white backdrop-blur-sm">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Tag chip — below thumbnail, no overlap */}
      {tag && (
        <span className="self-start rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
          {tag}
        </span>
      )}
    </div>
  );
}
