"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoThumb from "./VideoThumb";
import ClipPlayerSheet from "./ClipPlayerSheet";

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface TagAccordionProps {
  emoji: string;
  label: string;
  clips: TagClip[];
  onDeleteClip?: (clipId: string) => Promise<boolean>;
}

export default function TagAccordion({ emoji, label, clips, onDeleteClip }: TagAccordionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(clips.length > 0);
  const [playingClip, setPlayingClip] = useState<TagClip | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasClips = clips.length > 0;
  const topClip = clips.find((c) => c.isTop);

  const handleDelete = async (clipId: string) => {
    if (!onDeleteClip) return;
    setDeleting(true);
    try {
      await onDeleteClip(clipId);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px]">{emoji}</span>
          <span className="text-[13px] font-semibold text-text-1">{label}</span>
          <span className="text-[11px] text-text-3">{clips.length}개</span>
          {topClip && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">
              TOP
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {hasClips ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {clips.map((clip) => (
                <div key={clip.id} className="relative w-[140px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setPlayingClip(clip)}
                    className="w-full text-left"
                  >
                    <div className="relative">
                      <VideoThumb
                        thumbnailUrl={clip.thumbnailUrl ?? undefined}
                        duration={clip.duration}
                        aspectRatio="4/3"
                      />
                      {clip.isTop && (
                        <div className="absolute top-1 left-1 rounded bg-accent px-1 py-0.5 text-[8px] font-bold text-bg">
                          TOP
                        </div>
                      )}
                    </div>
                  </button>
                  {/* Delete button */}
                  {onDeleteClip && (
                    confirmDeleteId === clip.id ? (
                      <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                        <button
                          onClick={() => handleDelete(clip.id)}
                          disabled={deleting}
                          className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg"
                        >
                          {deleting ? "..." : "삭제"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md bg-white/30 px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(clip.id)}
                        className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm"
                        aria-label="영상 삭제"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )
                  )}
                </div>
              ))}
              {/* Add button */}
              <div className="flex w-[80px] shrink-0 items-center justify-center">
                <button onClick={() => router.push("/upload")} className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[var(--border-accent)] text-accent transition-colors active:bg-[var(--accent-bg)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-[var(--accent-bg)] py-5">
              <span className="text-[12px] text-text-3">아직 {label} 영상이 없어요</span>
              <button
                onClick={() => router.push("/upload")}
                className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-bg"
                style={{ background: "var(--accent-gradient)" }}
              >
                첫 영상 올리기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Player */}
      {playingClip && (
        <ClipPlayerSheet
          videoUrl={playingClip.videoUrl}
          onClose={() => setPlayingClip(null)}
        />
      )}
    </div>
  );
}
