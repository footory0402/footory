"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import HudOverlay from "@/components/video/hud/HudOverlay";
import IntroCard from "@/components/video/hud/IntroCard";

interface VideoPlayerProps {
  src: string;
  playerData?: HudPlayerData | null;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  /** 외부에서 seek 요청 시 이 값이 바뀜 */
  seekTo?: number;
  hudConfig?: HudConfig;
  onHudVisibleChange?: (visible: boolean) => void;
  hudVisible?: boolean;
  /** 인트로 프리뷰 모드 (영상 대신 IntroCard 표시) */
  showIntro?: boolean;
  /** 외부에서 일시정지 요청 (클립 마킹 시) */
  requestPause?: number;
}

export default function VideoPlayer({
  src,
  playerData,
  onTimeUpdate,
  seekTo,
  hudConfig,
  onHudVisibleChange,
  hudVisible = true,
  showIntro = false,
  requestPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const config = hudConfig ?? DEFAULT_HUD_CONFIG;

  // seekTo 변경 시 영상 seek
  useEffect(() => {
    if (seekTo !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTo;
    }
  }, [seekTo]);

  // 외부 일시정지 요청
  useEffect(() => {
    if (requestPause !== undefined && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [requestPause]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    onTimeUpdate(v.currentTime, v.duration || 0);
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    onTimeUpdate(0, v.duration);
  }, [onTimeUpdate]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const skipBy = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Video container — fills parent */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
        {showIntro && playerData ? (
          <div className="absolute inset-0">
            <IntroCard data={playerData} />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              className="h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setBuffering(true)}
              onCanPlay={() => setBuffering(false)}
              onClick={togglePlay}
              playsInline
            />

            {/* HUD overlay */}
            {hudVisible && playerData && <HudOverlay data={playerData} config={config} />}

            {/* Buffering indicator */}
            {buffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </>
        )}

        {/* Play/Pause center overlay */}
        {!isPlaying && !showIntro && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center"
            aria-label="재생"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <svg className="h-6 w-6 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Controls row — 영상 아래 컴팩트 */}
      <div className="flex shrink-0 items-center gap-2 px-2 py-1.5 bg-[#0D0D0F]">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 active:scale-95"
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* -5s / +5s */}
        <button
          onClick={() => skipBy(-5)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 active:scale-95"
        >
          -5초
        </button>
        <button
          onClick={() => skipBy(5)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 active:scale-95"
        >
          +5초
        </button>

        <div className="flex-1" />

        {/* Time display */}
        <span className="shrink-0 font-mono text-xs text-white/40">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* HUD toggle */}
        <label className="flex cursor-pointer items-center gap-1.5 select-none">
          <input
            type="checkbox"
            checked={hudVisible}
            onChange={(e) => onHudVisibleChange?.(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-[#E74C3C]"
          />
          <span className="text-xs text-white/50">HUD</span>
        </label>
      </div>
    </div>
  );
}
