"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ClipPlayerSheetProps {
  videoUrl: string;
  clipId?: string;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
}

export default function ClipPlayerSheet({ videoUrl, clipId, onClose, onDelete }: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Swipe-down state
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ y: number; time: number } | null>(null);

  // Lock scroll
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

  // Auto-hide controls after 3s
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Tap to play/pause
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

  // Progress tracking
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
  }, [scheduleHide]);

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) {
      videoRef.current.currentTime = ratio * duration;
    }
  };

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { y: e.touches[0].clientY, time: Date.now() };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dy = e.touches[0].clientY - dragStart.current.y;
    if (dy > 0) {
      setDragging(true);
      setDragY(dy);
    }
  };
  const handleTouchEnd = () => {
    if (!dragStart.current) return;
    const velocity = dragY / (Date.now() - dragStart.current.time);
    if (dragY > 120 || velocity > 0.5) {
      onClose();
    } else {
      setDragY(0);
      setDragging(false);
    }
    dragStart.current = null;
  };

  const handleDelete = async () => {
    if (!clipId || !onDelete) return;
    setDeleting(true);
    const ok = await onDelete(clipId);
    setDeleting(false);
    if (ok) onClose();
    else setConfirmDelete(false);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const opacity = dragging ? Math.max(0, 1 - dragY / 400) : 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: `rgba(0,0,0,${0.9 * opacity})` }}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-[430px] px-4"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/30" />

        {/* Top controls */}
        <div
          className="absolute -top-12 right-4 left-4 flex items-center justify-between transition-opacity duration-200"
          style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
        >
          {/* More menu (delete inside) */}
          <div className="relative">
            {onDelete && clipId && (
              <button
                onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            )}

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute top-11 left-0 z-10 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]/95 backdrop-blur-xl shadow-2xl">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-red-400 active:bg-white/5"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    영상 삭제
                  </button>
                ) : (
                  <div className="flex flex-col">
                    <p className="px-4 pt-3 pb-2 text-[12px] text-text-2">정말 삭제할까요?</p>
                    <div className="flex border-t border-white/10">
                      <button
                        onClick={() => { setConfirmDelete(false); setMenuOpen(false); }}
                        className="flex-1 py-2.5 text-[13px] text-white active:bg-white/5"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 border-l border-white/10 py-2.5 text-[13px] font-semibold text-red-400 active:bg-white/5"
                      >
                        {deleting ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!onDelete && <div />}

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Video + tap overlay */}
        <div className="relative overflow-hidden rounded-xl">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            playsInline
            className="w-full rounded-xl"
            style={{ maxHeight: "70vh" }}
            onClick={(e) => e.preventDefault()}
          />

          {/* Tap target — full video area */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!menuOpen) handleTap();
              else { setMenuOpen(false); setConfirmDelete(false); }
            }}
            className="absolute inset-0 z-10"
            aria-label={paused ? "재생" : "일시정지"}
          />

          {/* Pause icon overlay */}
          {paused && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm animate-fade-up">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom progress bar + time */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-200"
            style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
          >
            <div className="bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-6">
              {/* Time */}
              <div className="mb-2 flex justify-between font-stat text-[11px] text-white/80">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
              {/* Seek bar */}
              <div
                className="relative h-6 flex items-center cursor-pointer"
                onClick={handleSeek}
                onTouchMove={handleSeek}
              >
                <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute h-3.5 w-3.5 rounded-full bg-accent shadow-lg border-2 border-white/30"
                  style={{ left: `calc(${progress * 100}% - 7px)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background tap to close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="닫기"
      />
    </div>
  );
}
