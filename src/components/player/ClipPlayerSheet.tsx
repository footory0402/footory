"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface PlayableClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number;
}

interface ClipPlayerSheetProps {
  clips: PlayableClip[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
}

export default function ClipPlayerSheet({
  clips,
  initialIndex = 0,
  onClose,
  onDelete,
  onEditTags,
}: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Mount animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sheet drag-down state
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDragStart = useRef<{ y: number; time: number } | null>(null);

  // Swipe left/right state
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null } | null>(null);

  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;

  // Prevent click from firing after touch (double-toggle fix)
  const touchHandled = useRef(false);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Reset on clip change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setConfirmDelete(false);
    setShowControls(true);
    scheduleHide();
  }, [index]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setDuration(v.duration || 0);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onPlay = () => { setPaused(false); scheduleHide(); };
    const onPause = () => { setPaused(true); setShowControls(true); };
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoaded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [scheduleHide, index]);

  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPaused(false);
      setShowControls(true);
      scheduleHide();
    } else {
      v.pause();
      setPaused(true);
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [scheduleHide]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) {
      videoRef.current.currentTime = ratio * duration;
    }
  };

  // ── Video swipe left/right ──
  const handleVideoTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null };
  };
  const handleVideoTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeStart.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeStart.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      } else return;
    }
    if (swipeStart.current.locked === "h") {
      if ((dx < 0 && hasNext) || (dx > 0 && hasPrev)) {
        setSwiping(true);
        setSwipeX(dx);
      }
    }
  };
  const handleVideoTouchEnd = () => {
    if (!swipeStart.current) return;
    if (swipeStart.current.locked === "h" && swiping) {
      const velocity = Math.abs(swipeX) / (Date.now() - swipeStart.current.time);
      if (swipeX < -60 || (swipeX < 0 && velocity > 0.3)) {
        if (hasNext) goToClip(index + 1);
      } else if (swipeX > 60 || (swipeX > 0 && velocity > 0.3)) {
        if (hasPrev) goToClip(index - 1);
      }
      setSwipeX(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      handleTap();
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 300);
    }
    swipeStart.current = null;
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // ── Sheet drag down ──
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetDragStart.current = { y: e.touches[0].clientY, time: Date.now() };
  };
  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!sheetDragStart.current) return;
    const dy = e.touches[0].clientY - sheetDragStart.current.y;
    if (dy > 0) { setSheetDragging(true); setSheetDragY(dy); }
  };
  const handleSheetTouchEnd = () => {
    if (!sheetDragStart.current) return;
    const velocity = sheetDragY / (Date.now() - sheetDragStart.current.time);
    if (sheetDragY > 100 || velocity > 0.5) onClose();
    else { setSheetDragY(0); setSheetDragging(false); }
    sheetDragStart.current = null;
  };

  const handleDelete = async () => {
    if (!clip || !onDelete) return;
    setDeleting(true);
    const ok = await onDelete(clip.id);
    setDeleting(false);
    if (ok) {
      if (clips.length <= 1) onClose();
      else if (index >= clips.length - 1) setIndex(index - 1);
      setConfirmDelete(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const bgOpacity = sheetDragging ? Math.max(0, 1 - sheetDragY / 500) : mounted ? 1 : 0;

  if (!clip || !clip.videoUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* ── Backdrop: blur + dark ── */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: `rgba(0,0,0,${0.85 * bgOpacity})`,
          backdropFilter: `blur(${mounted ? 12 : 0}px)`,
          WebkitBackdropFilter: `blur(${mounted ? 12 : 0}px)`,
        }}
      />
      <button type="button" onClick={onClose} className="absolute inset-0 z-0" aria-label="닫기" />

      {/* ── Bottom Sheet ── */}
      <div
        className="relative z-10 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[20px]"
        style={{
          transform: `translateY(${sheetDragging ? sheetDragY : mounted ? 0 : 400}px)`,
          transition: sheetDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "94vh",
        }}
      >
        {/* Gold accent line — 모달임을 확실히 */}
        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent 5%, var(--color-accent) 30%, var(--color-accent) 70%, transparent 95%)" }} />

        {/* Sheet background */}
        <div className="bg-[#111113] border-x border-white/[0.06]">

          {/* ── Header ── */}
          <div
            className="relative flex items-center justify-between px-4 pt-3 pb-2"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="absolute left-1/2 top-1.5 -translate-x-1/2">
              <div className="h-[5px] w-12 rounded-full bg-white/20" />
            </div>

            {/* Left: title + info */}
            <div className="flex items-center gap-2.5 pt-2">
              {/* Play icon accent */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-white">
                  {clip.tag || "영상 재생"}
                </span>
                {clips.length > 1 && (
                  <span className="font-stat text-[11px] text-text-3">
                    {index + 1} / {clips.length}
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white/70 active:bg-white/15 active:text-white mt-1"
              aria-label="닫기"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Video ── */}
          <div className="relative mx-3 overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.06]">
            {/* Swipe direction hints */}
            {swiping && swipeX < -20 && hasNext && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-accent/80 shadow-lg shadow-accent/20 animate-fade-up">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            )}
            {swiping && swipeX > 20 && hasPrev && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-accent/80 shadow-lg shadow-accent/20 animate-fade-up">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M15 18l-6-6 6-6"/></svg>
              </div>
            )}

            <video
              key={clip.id}
              ref={videoRef}
              src={clip.videoUrl || undefined}
              autoPlay={!!clip.videoUrl}
              playsInline
              className="w-full"
              style={{
                maxHeight: "52vh",
                transform: swiping ? `translateX(${swipeX * 0.3}px)` : undefined,
                transition: swiping ? "none" : "transform 0.2s ease",
                opacity: swiping ? Math.max(0.5, 1 - Math.abs(swipeX) / 300) : 1,
              }}
              onClick={(e) => e.preventDefault()}
            />

            {/* Touch overlay */}
            <div
              className="absolute inset-0 z-10"
              onTouchStart={handleVideoTouchStart}
              onTouchMove={handleVideoTouchMove}
              onTouchEnd={handleVideoTouchEnd}
              onClick={() => { if (!touchHandled.current) handleTap(); }}
            />

            {/* Pause overlay */}
            {paused && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm animate-fade-up ring-2 ring-white/10">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Nav arrows (visible on pause or controls shown) */}
            {hasPrev && (
              <button
                onClick={() => goToClip(index - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-accent/80 transition-all"
                style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => goToClip(index + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-accent/80 transition-all"
                style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )}
          </div>

          {/* ── Seekbar ── */}
          <div className="mx-4 mt-3">
            <div
              className="relative h-7 flex items-center cursor-pointer"
              onClick={handleSeek}
              onTouchMove={handleSeek}
            >
              <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
              </div>
              <div
                className="absolute h-4 w-4 rounded-full bg-accent shadow-lg shadow-accent/30 border-2 border-white/40"
                style={{ left: `calc(${progress * 100}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between font-stat text-[11px] text-text-3 -mt-0.5 px-0.5">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* ── Clip dots (if multiple) ── */}
          {clips.length > 1 && clips.length <= 12 && (
            <div className="flex items-center justify-center gap-1.5 py-2">
              {clips.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToClip(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === index
                      ? "h-2 w-5 bg-accent shadow-sm shadow-accent/30"
                      : "h-2 w-2 bg-white/15 active:bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* ── Action Bar — 눈에 확 띄게 ── */}
          <div className="mx-3 mb-3 mt-1 flex items-center gap-2 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/[0.06]">
            {/* Tag edit */}
            {onEditTags && (
              <button
                onClick={() => onEditTags(clip.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.06] py-3 text-[13px] font-medium text-text-2 active:bg-accent/15 active:text-accent transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                태그 편집
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/[0.08] py-3 text-[13px] font-medium text-red-400 ring-1 ring-red-500/10 active:bg-red-500/20 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    삭제
                  </button>
                ) : (
                  <div className="flex flex-1 items-center gap-2 animate-fade-up">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex flex-1 items-center justify-center rounded-xl bg-white/[0.06] py-3 text-[13px] text-text-3 active:bg-white/10"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex flex-1 items-center justify-center rounded-xl bg-red-500/20 py-3 text-[13px] font-bold text-red-400 ring-1 ring-red-500/20 active:bg-red-500/30"
                    >
                      {deleting ? "삭제 중..." : "정말 삭제"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* No actions fallback — just close hint */}
            {!onDelete && !onEditTags && (
              <div className="flex flex-1 items-center justify-center py-3 text-[12px] text-text-3">
                아래로 스와이프하여 닫기
              </div>
            )}
          </div>

          {/* Safe area */}
          <div className="h-[env(safe-area-inset-bottom,8px)]" />
        </div>
      </div>
    </div>
  );
}
