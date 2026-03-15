"use client";

import { useRef, useState, useCallback } from "react";

interface TimelineClip {
  id: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

interface ReelTimelineProps {
  clips: TimelineClip[];
  onReorder: (ids: string[]) => void;
}

export default function ReelTimeline({ clips, onReorder }: ReelTimelineProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setOverIndex(index);
    },
    [dragIndex]
  );

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) return;

      const ids = clips.map((c) => c.id);
      const [moved] = ids.splice(dragIndex, 1);
      ids.splice(targetIndex, 0, moved);

      onReorder(ids);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, clips, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  // Touch 기반 드래그 (모바일)
  const touchStart = useRef<{ index: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (index: number, e: React.TouchEvent) => {
      touchStart.current = { index, y: e.touches[0].clientY };
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || !containerRef.current) return;

      const touch = e.touches[0];
      const container = containerRef.current;
      const items = container.querySelectorAll("[data-timeline-item]");

      for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          setOverIndex(i);
          break;
        }
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStart.current !== null && overIndex !== null) {
      handleDrop(overIndex);
    }
    touchStart.current = null;
    setOverIndex(null);
  }, [overIndex, handleDrop]);

  const totalDuration = clips.reduce(
    (sum, c) => sum + (c.durationSeconds ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[12px] text-text-3">
        <span>{clips.length}개 클립</span>
        <span className="font-stat text-accent">{totalDuration}초</span>
      </div>

      <div
        ref={containerRef}
        className="flex flex-col gap-1"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            data-timeline-item
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(index, e)}
            className={`flex items-center gap-3 rounded-xl bg-card px-3 py-2 touch-none cursor-grab active:cursor-grabbing ${
              overIndex === index ? "ring-1 ring-accent" : ""
            } ${dragIndex === index ? "opacity-50" : ""}`}
          >
            {/* 드래그 핸들 */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-text-3"
            >
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>

            {/* 순서 번호 */}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
              {index + 1}
            </span>

            {/* 썸네일 */}
            <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-black">
              {clip.thumbnailUrl ? (
                <img
                  src={clip.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1E1E22]">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-text-3"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              )}
            </div>

            {/* 듀레이션 */}
            <span className="text-[12px] font-stat text-text-2">
              {clip.durationSeconds ?? 0}초
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-text-3">
        드래그하여 순서를 변경하세요
      </p>
    </div>
  );
}
