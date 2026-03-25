"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";

function getVideoErrorMessage(code: number): { message: string; retryable: boolean } {
  switch (code) {
    case 2: return { message: "네트워크 오류로 영상을 불러올 수 없습니다", retryable: true };
    case 3: return { message: "영상 파일이 손상되어 재생할 수 없습니다", retryable: false };
    case 4: return { message: "지원하지 않는 영상 형식입니다", retryable: true };
    default: return { message: "영상을 불러올 수 없습니다", retryable: true };
  }
}

export interface PlayableClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number;
  // spotlight overlay
  spotlightX?: number | null;
  spotlightY?: number | null;
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
  // css effects
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  } | null;
}

interface ClipPlayerSheetProps {
  clips: PlayableClip[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
}

export default function ClipPlayerSheet({
  clips: clipsProp,
  initialIndex = 0,
  onClose,
  onDelete,
  onEditTags,
  onShare,
}: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local copy so we can remove deleted clips without waiting for parent re-render
  const [localClips, setLocalClips] = useState(clipsProp);
  const [index, setIndex] = useState(initialIndex);
  const clips = localClips;
  const [paused, setPaused] = useState(false);
  const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [playCount, setPlayCount] = useState(0);

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
    setVideoError(null);
    setRetryCount(0);
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
    const onPlay = () => { setPaused(false); scheduleHide(); setPlayCount((c) => c + 1); };
    const onPause = () => { setPaused(true); setShowControls(true); };
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoaded);
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
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

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v || !clip) return;
    if (retryCount >= 3) return;
    const count = retryCount + 1;
    setRetryCount(count);
    setVideoError(null);
    const separator = clip.videoUrl.includes("?") ? "&" : "?";
    v.src = `${clip.videoUrl}${separator}t=${Date.now()}`;
    v.load();
  }, [retryCount, clip]);

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
      const remaining = localClips.filter((c) => c.id !== clip.id);
      if (remaining.length === 0) {
        onClose();
      } else {
        const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
        setLocalClips(remaining);
        setIndex(nextIndex);
      }
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
              preload="metadata"
              className="w-full"
              style={{
                maxHeight: "52vh",
                transform: swiping ? `translateX(${swipeX * 0.3}px)` : undefined,
                transition: swiping ? "none" : "transform 0.2s ease",
                opacity: swiping ? Math.max(0.5, 1 - Math.abs(swipeX) / 300) : 1,
                visibility: videoError ? "hidden" : undefined,
                height: videoError ? 0 : undefined,
                overflow: videoError ? "hidden" : undefined,
                // 색보정 필터 (effects.color)
                filter: clip.effects?.color
                  ? "saturate(1.2) contrast(1.05) brightness(1.02)"
                  : undefined,
              }}
              onClick={(e) => e.preventDefault()}
            />

            {/* VideoOverlay — spotlight 또는 eafc/cinematic effects가 있을 때 표시 */}
            {clip.playerName && (clip.spotlightX != null || clip.effects?.eafc || clip.effects?.cinematic) && (
              <VideoOverlay
                key={playCount}
                spotlight={
                  clip.spotlightX != null && clip.spotlightY != null
                    ? { x: clip.spotlightX, y: clip.spotlightY }
                    : null
                }
                player={{
                  name: clip.playerName,
                  position: clip.playerPosition,
                  birthYear: clip.playerBirthYear,
                  teamName: clip.teamName,
                }}
                effects={clip.effects}
              />
            )}

            {/* Video error UI */}
            {videoError && (
              <div className="flex aspect-video max-h-[52vh] w-full flex-col items-center justify-center gap-3 bg-[#111113]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-[13px] text-text-2 text-center px-6">{videoError.message}</p>
                {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
                  <button
                    onClick={handleRetry}
                    className="rounded-lg bg-white/[0.08] px-4 py-2 text-[12px] font-medium text-text-1 active:bg-white/[0.12]"
                  >
                    다시 시도
                  </button>
                )}
                {retryCount >= 3 && (
                  <p className="text-[11px] text-text-3 text-center px-6">
                    문제가 계속되면 영상을 다시 업로드해 주세요
                  </p>
                )}
              </div>
            )}

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

          {/* ── Action Bar ── */}
          <div className="mx-3 mb-3 mt-1 flex items-center gap-2 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/[0.06]">
            {/* Share */}
            {onShare && (
              <button
                onClick={() => onShare(clip.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.06] py-3 text-[13px] font-medium text-text-2 active:bg-accent/15 active:text-accent transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                공유
              </button>
            )}

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

            {/* Delete — icon-only, low-key */}
            {onDelete && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-3 active:bg-red-500/10 active:text-red-400 transition-colors"
                aria-label="영상 삭제"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}

            {/* Delete confirm */}
            {onDelete && confirmDelete && (
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

            {/* No actions fallback — just close hint */}
            {!onDelete && !onEditTags && !onShare && (
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
