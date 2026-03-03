"use client";

import { useState } from "react";
import VideoThumb from "./VideoThumb";

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
}

interface TagAccordionProps {
  tagId: string;
  emoji: string;
  label: string;
  clips: TagClip[];
}

export default function TagAccordion({ tagId, emoji, label, clips }: TagAccordionProps) {
  const [open, setOpen] = useState(clips.length > 0);
  const hasClips = clips.length > 0;
  const topClip = clips.find((c) => c.isTop);

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card">
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
                <div key={clip.id} className="w-[140px] shrink-0">
                  <div className="relative">
                    <VideoThumb duration={clip.duration} aspectRatio="4/3" />
                    {clip.isTop && (
                      <div className="absolute top-1 left-1 rounded bg-accent px-1 py-0.5 text-[8px] font-bold text-bg">
                        TOP
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Add button */}
              <div className="flex w-[80px] shrink-0 items-center justify-center">
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[var(--border-accent)] text-accent transition-colors active:bg-[var(--accent-bg)]">
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
                className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-bg"
                style={{ background: "var(--accent-gradient)" }}
              >
                첫 영상 올리기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
