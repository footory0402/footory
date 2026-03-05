"use client";

export default function ClipShareCard({
  thumbnailUrl,
  title,
  playerName,
  onClick,
}: {
  thumbnailUrl?: string;
  title?: string;
  playerName?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-[10px] bg-card text-left"
    >
      <div className="relative aspect-video bg-surface">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title ?? "클립"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-[13px] font-medium text-text-1 truncate">
          {title ?? "하이라이트 영상"}
        </p>
        {playerName && (
          <p className="text-[12px] text-text-2 truncate">{playerName}</p>
        )}
      </div>
    </button>
  );
}
