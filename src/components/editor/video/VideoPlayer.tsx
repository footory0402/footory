"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import HudOverlay from "@/components/video/hud/HudOverlay";
import IntroCard from "@/components/video/hud/IntroCard";

interface VideoPlayerProps {
  src: string;
  playerData: HudPlayerData;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  /** 외부에서 seek 요청 시 이 값이 바뀜 */
  seekTo?: number;
  hudConfig?: HudConfig;
  /** 인트로 프리뷰 모드 (영상 대신 IntroCard 표시) */
  showIntro?: boolean;
}

export interface VideoPlayerRef {
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
}

export default function VideoPlayer({
  src,
  playerData,
  onTimeUpdate,
  seekTo,
  hudConfig,
  showIntro = false,
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

  const handleSeekBar = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 16:9 video container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
        {showIntro ? (
          /* 인트로 카드 프리뷰 */
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
              playsInline
            />

            {/* HUD overlay */}
            <HudOverlay data={playerData} config={config} />

            {/* Buffering indicator */}
            {buffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </>
        )}

        {/* Play/Pause overlay button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            {isPlaying ? (
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="h-6 w-6 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-1">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 active:scale-95"
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

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeekBar}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[#D4A853]"
        />

        {/* Time display */}
        <span className="shrink-0 font-mono text-xs text-white/50">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
