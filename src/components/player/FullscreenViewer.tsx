"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface PlayableClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number;
  memo?: string;
}

interface FullscreenViewerProps {
  clips: PlayableClip[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
}

export default function FullscreenViewer({ clips, initialIndex = 0, onClose, onDelete, onEditTags }: FullscreenViewerProps) {
  // State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;

  // 세로 스와이프 상태
  const [swipeY, setSwipeY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStart = useRef<{ y: number; time: number } | null>(null);

  // 마운트 애니메이션
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // body scroll 잠금
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

  // 컨트롤 자동 숨김 (5초)
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 5000);
  }, []);

  // 클립 변경 시 리셋
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setConfirmDelete(false);
    setShowMenu(false);
    setShowControls(true);
    scheduleHide();
  }, [index, scheduleHide]);

  // 비디오 이벤트
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

  // 탭 재생/일시정지 (즉시, 딜레이 없음)
  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setShowControls(true);
      scheduleHide();
    } else {
      v.pause();
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [scheduleHide]);

  // 시크바
  const seekbarRef = useRef<HTMLDivElement>(null);
  const handleSeek = useCallback((clientX: number) => {
    const bar = seekbarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current) videoRef.current.currentTime = ratio * duration;
  }, [duration]);

  // 세로 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    // 시크바 영역이면 무시
    if ((e.target as HTMLElement).closest('[data-seekbar]')) return;
    swipeStart.current = { y: e.touches[0].clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    if ((e.target as HTMLElement).closest('[data-seekbar]')) return;
    const dy = e.touches[0].clientY - swipeStart.current.y;
    setIsSwiping(true);
    setSwipeY(dy);
  };

  const handleTouchEnd = () => {
    if (!swipeStart.current) return;
    const elapsed = Date.now() - swipeStart.current.time;
    const velocity = Math.abs(swipeY) / elapsed;

    if (swipeY < -80 || (swipeY < -30 && velocity > 0.3)) {
      // 위로 스와이프 → 다음 클립
      if (hasNext) setIndex(index + 1);
    } else if (swipeY > 80 || (swipeY > 30 && velocity > 0.3)) {
      // 아래로 스와이프 → 이전 클립 or 닫기
      if (hasPrev) setIndex(index - 1);
      else onClose();
    } else if (!isSwiping || Math.abs(swipeY) < 10) {
      // 탭 (스와이프 아님)
      handleTap();
    }

    setSwipeY(0);
    setIsSwiping(false);
    swipeStart.current = null;
  };

  // 삭제
  const handleDelete = async () => {
    if (!clip || !onDelete) return;
    setDeleting(true);
    const ok = await onDelete(clip.id);
    setDeleting(false);
    if (ok) {
      if (clips.length <= 1) onClose();
      else if (index >= clips.length - 1) setIndex(index - 1);
      setConfirmDelete(false);
      setShowMenu(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!clip || !clip.videoUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease" }}>

      {/* 영상 + 스와이프 영역 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isSwiping ? `translateY(${swipeY * 0.4}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.3s ease",
        }}
      >
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.videoUrl}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />

        {/* 일시정지 오버레이 */}
        {paused && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/50 backdrop-blur-sm ring-2 ring-accent/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 상단 바 (glass-nav) */}
      <div
        className="absolute inset-x-0 top-0 z-30 transition-opacity duration-300"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          paddingTop: "env(safe-area-inset-top, 0px)"
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          {/* 뒤로 */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* 클립 정보 */}
          <div className="flex flex-col items-center">
            {clip.tag && (
              <span className="rounded-full bg-accent/20 px-3 py-0.5 text-[12px] font-medium text-accent">
                {clip.tag}
              </span>
            )}
            {clips.length > 1 && (
              <span className="mt-0.5 font-stat text-[11px] text-white/50">
                {index + 1} / {clips.length}
              </span>
            )}
          </div>

          {/* 더보기 */}
          <button
            onClick={() => setShowMenu(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20"
            aria-label="더보기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          paddingBottom: "env(safe-area-inset-bottom, 0px)"
        }}
      >
        <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pb-4 pt-12">
          {/* 시크바 */}
          <div
            ref={seekbarRef}
            data-seekbar
            className="group relative mb-2 h-10 flex items-end cursor-pointer touch-none"
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              handleSeek(e.clientX);
              setShowControls(true);
              scheduleHide();
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0) return;
              handleSeek(e.clientX);
            }}
          >
            <div className="w-full h-1.5 rounded-full bg-white/20 group-active:h-2.5 transition-all">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div
              className="absolute bottom-0 -translate-x-1/2 h-4 w-4 rounded-full bg-accent shadow-[0_0_8px_rgba(212,168,83,0.6)] transition-opacity"
              style={{ left: `${progress * 100}%` }}
            />
          </div>

          {/* 시간 */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-stat text-[13px] tracking-wider text-white/80">
              {fmt(currentTime)}
              <span className="text-white/40"> / {fmt(duration)}</span>
            </span>

            {/* 클립 인디케이터 (12개 이하) */}
            {clips.length > 1 && clips.length <= 12 && (
              <div className="flex items-center gap-1">
                {clips.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`rounded-full transition-all ${
                      i === index
                        ? "h-2 w-5 bg-accent"
                        : "h-2 w-2 bg-white/20 active:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 우상단 시간 pill (항상 보임) */}
      <div className="pointer-events-none absolute right-4 z-20" style={{ top: "calc(env(safe-area-inset-top, 0px) + 60px)" }}>
        <div className="rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-stat text-[13px] tracking-wider text-white">
            {fmt(currentTime)}
            <span className="text-white/40"> / {fmt(duration)}</span>
          </span>
        </div>
      </div>

      {/* 스와이프 힌트 */}
      {isSwiping && (
        <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
          style={{ [swipeY < 0 ? "bottom" : "top"]: "20%" }}>
          <div className="rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <span className="text-[12px] text-white/60">
              {swipeY < 0 ? (hasNext ? "다음 영상" : "마지막 영상") : (hasPrev ? "이전 영상" : "닫기")}
            </span>
          </div>
        </div>
      )}

      {/* 더보기 메뉴 (바텀시트) */}
      {showMenu && (
        <div className="fixed inset-0 z-[110]">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => { setShowMenu(false); setConfirmDelete(false); }}
          />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] rounded-t-2xl bg-[#1A1A1E] pb-[env(safe-area-inset-bottom,8px)]">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />

            <div className="px-4 py-3">
              {onEditTags && (
                <button
                  onClick={() => { onEditTags(clip.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-white active:bg-white/5"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  태그 편집
                </button>
              )}

              {onDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-red-400 active:bg-red-500/10"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  삭제
                </button>
              )}

              {confirmDelete && (
                <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
                  <p className="mb-3 text-[13px] text-red-300">이 영상을 삭제하면 복구할 수 없습니다</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-lg bg-white/10 py-2.5 text-[13px] text-white active:bg-white/15"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-lg bg-red-500/30 py-2.5 text-[13px] font-bold text-red-300 active:bg-red-500/40"
                    >
                      {deleting ? "삭제 중..." : "정말 삭제"}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(false); }}
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-white/[0.06] py-3.5 text-[15px] text-text-3 active:bg-white/10"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
