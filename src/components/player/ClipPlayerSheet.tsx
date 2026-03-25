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
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [playCount, setPlayCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 위아래 스와이프
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null } | null>(null);

  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;
  const effects = clip?.effects;
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
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  // Reset on clip change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setVideoError(null);
    setRetryCount(0);
    setShowControls(true);
    scheduleHide();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Video event listeners
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
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoaded);
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
    if (v.paused) { v.play(); setPaused(false); setShowControls(true); scheduleHide(); }
    else { v.pause(); setPaused(true); setShowControls(true); }
  }, [scheduleHide]);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v || !clip || retryCount >= 3) return;
    setRetryCount((c) => c + 1);
    setVideoError(null);
    const sep = clip.videoUrl.includes("?") ? "&" : "?";
    v.src = `${clip.videoUrl}${sep}t=${Date.now()}`;
    v.load();
  }, [retryCount, clip]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) videoRef.current.currentTime = ratio * duration;
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // 위아래 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeStart.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeStart.current.locked = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      } else return;
    }
    if (swipeStart.current.locked === "v") {
      setSwiping(true);
      setSwipeY(dy);
    }
  };
  const handleTouchEnd = () => {
    if (!swipeStart.current) return;
    if (swipeStart.current.locked === "v" && swiping) {
      const elapsed = Date.now() - swipeStart.current.time;
      const velocity = Math.abs(swipeY) / elapsed;
      if (swipeY < -60 || (swipeY < 0 && velocity > 0.3)) {
        // 위로 스와이프 → 다음 클립
        if (hasNext) goToClip(index + 1);
      } else if (swipeY > 60 || (swipeY > 0 && velocity > 0.3)) {
        if (velocity > 0.5 && !hasPrev) {
          // 첫 클립에서 빠르게 아래 → 닫기
          onClose();
        } else if (hasPrev) {
          goToClip(index - 1);
        } else if (velocity > 0.5) {
          onClose();
        }
      }
      setSwipeY(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      handleTap();
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 300);
    }
    swipeStart.current = null;
  };

  const handleDelete = async () => {
    if (!clip || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 2000);
      return;
    }
    setConfirmDelete(false);
    const ok = await onDelete(clip.id);
    if (ok) {
      const remaining = localClips.filter((c) => c.id !== clip.id);
      if (remaining.length === 0) { onClose(); return; }
      const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
      setLocalClips(remaining);
      setIndex(nextIndex);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!clip?.videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{ animation: "fullscreen-player-in 0.25s ease-out" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 블러 배경 (가로 영상 처리) ── */}
      {clip.thumbnailUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${clip.thumbnailUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) brightness(0.35)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* ── 영상 ── */}
      {!videoError && (
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.videoUrl}
          autoPlay
          playsInline
          preload="metadata"
          loop
          className="absolute inset-0 z-10 h-full w-full"
          style={{
            objectFit: "contain",
            transform: swiping ? `translateY(${swipeY * 0.2}px)` : undefined,
            transition: swiping ? "none" : "transform 0.2s ease",
            filter: effects?.color ? "saturate(1.2) contrast(1.05) brightness(1.02)" : undefined,
          }}
          onClick={(e) => { e.preventDefault(); if (!touchHandled.current) handleTap(); }}
        />
      )}

      {/* ── VideoOverlay ── */}
      {clip.playerName && (clip.spotlightX != null || effects?.eafc || effects?.cinematic) && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <VideoOverlay
            key={playCount}
            spotlight={clip.spotlightX != null && clip.spotlightY != null
              ? { x: clip.spotlightX, y: clip.spotlightY }
              : null}
            player={{
              name: clip.playerName,
              position: clip.playerPosition,
              birthYear: clip.playerBirthYear,
              teamName: clip.teamName,
            }}
            effects={effects}
          />
        </div>
      )}

      {/* ── 에러 UI ── */}
      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-center text-[13px] text-white/70 px-8">{videoError.message}</p>
          {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
            <button onClick={handleRetry} className="rounded-lg bg-white/10 px-4 py-2 text-[12px] text-white active:bg-white/20">
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* ── 일시정지 오버레이 ── */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* ── 상단 헤더 ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-2"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white active:bg-black/50"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {clips.length > 1 && (
          <span className="ml-3 font-stat text-[12px] text-white/70">{index + 1} / {clips.length}</span>
        )}
      </div>

      {/* ── 우측 액션 버튼 ── */}
      <div
        className="absolute right-4 bottom-32 z-40 flex flex-col items-center gap-5"
        style={{
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {onShare && (
          <button onClick={() => onShare(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-accent/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">공유</span>
          </button>
        )}
        {onEditTags && (
          <button onClick={() => onEditTags(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">편집</span>
          </button>
        )}
        {onDelete && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-1">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm active:scale-95 transition-all ${
              confirmDelete
                ? "bg-red-500/80 text-white"
                : "bg-black/40 text-white/60 active:bg-red-500/30 active:text-red-400"
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <span className={`text-[10px] ${confirmDelete ? "text-red-400" : "text-white/40"}`}>
              {confirmDelete ? "확인?" : "삭제"}
            </span>
          </button>
        )}
      </div>

      {/* ── 하단 정보 + seekbar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,16px)]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* 선수 정보 */}
        <div className="mb-3 pr-16">
          {clip.playerName && (
            <p className="text-[15px] font-bold text-white">{clip.playerName}</p>
          )}
          {clip.tag && (
            <p className="text-[12px] text-white/60">{clip.tag}</p>
          )}
        </div>

        {/* Seekbar */}
        <div
          className="relative h-6 flex items-center cursor-pointer mb-1"
          onClick={handleSeek}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => { e.stopPropagation(); handleSeek(e); }}
        >
          <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute h-3 w-3 rounded-full bg-accent"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between font-stat text-[10px] text-white/40">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── 클립 도트 ── */}
      {clips.length > 1 && clips.length <= 12 && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5"
          style={{ opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}
        >
          {clips.map((_, i) => (
            <button
              key={i}
              onClick={() => goToClip(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? "h-5 w-1.5 bg-accent"
                  : "h-1.5 w-1.5 bg-white/30 active:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
