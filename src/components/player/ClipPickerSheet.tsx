"use client";

import { useEffect } from "react";
import { useClips } from "@/hooks/useClips";

interface ClipPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (clipId: string) => void;
  excludeClipIds: string[];
}

export default function ClipPickerSheet({
  open,
  onClose,
  onSelect,
  excludeClipIds,
}: ClipPickerSheetProps) {
  const { clips, loading, fetchClips } = useClips();

  useEffect(() => {
    if (open) fetchClips();
  }, [open, fetchClips]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-[430px] rounded-t-2xl bg-[var(--color-surface)] px-4 pb-8 pt-4">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border)]" />

        <h3 className="mb-4 text-base font-bold text-[var(--color-text)]">
          클립 선택
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : clips.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-3)]">
            업로드된 클립이 없습니다
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {clips.map((clip) => {
              const disabled = excludeClipIds.includes(clip.id);
              return (
                <button
                  key={clip.id}
                  disabled={disabled}
                  onClick={() => {
                    onSelect(clip.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "bg-[var(--color-card)] active:bg-[var(--color-card-alt)]"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg)]">
                    {clip.thumbnail_url ? (
                      <img
                        src={clip.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {clip.memo || "제목 없음"}
                    </p>
                    <p className="text-xs text-[var(--color-text-3)]">
                      {clip.duration_seconds ? `${clip.duration_seconds}초` : ""}{" "}
                      {clip.tags.length > 0 && `· ${clip.tags.join(", ")}`}
                    </p>
                  </div>

                  {disabled && (
                    <span className="shrink-0 text-[10px] text-[var(--color-accent)]">
                      설정됨
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
