"use client";

import { useRef, useState, useCallback } from "react";
import { useFootoryPlayer, type FootoryPlayerClip } from "@/hooks/useFootoryPlayer";

interface FootoryPlayerProps {
  clip: FootoryPlayerClip;
  playerName?: string;
  playerPosition?: string;
  playerNumber?: number;
  autoPlay?: boolean;
  compact?: boolean;
}

export default function FootoryPlayer({
  clip,
  playerName = "",
  playerPosition = "",
  playerNumber,
  autoPlay = false,
  compact = false,
}: FootoryPlayerProps) {
  const {
    videoRef,
    videoSrc,
    phase,
    formattedTime,
    formattedDuration,
    progress,
    isPlaying,
    isMuted,
    showSpotlight,
    showControls,
    handleTimeUpdate,
    handleLoadedMetadata,
    togglePlay,
    seekByProgress,
    skip,
    toggleMute,
    toggleFullscreen,
    resetControlsTimer,
    hasSlowmo,
  } = useFootoryPlayer({ clip, autoPlay, compact });

  const effects = clip.effects ?? {};
  const showCinematic = effects.cinematic === true;
  const showColor = effects.color === true;
  const showEafc = effects.eafc === true && !compact;
  const showIntro = effects.intro === true && !compact;
  const skillLabels = [
    ...(clip.skill_labels ?? []),
    ...(clip.custom_labels ?? []),
  ];
  const showSkillLabels = skillLabels.length > 0 && !compact;

  // --- Tap feedback ---
  const [tapFeedback, setTapFeedback] = useState<"play" | "pause" | null>(null);
  const tapFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTapFeedback = useCallback((type: "play" | "pause") => {
    setTapFeedback(type);
    if (tapFeedbackTimer.current) clearTimeout(tapFeedbackTimer.current);
    tapFeedbackTimer.current = setTimeout(() => setTapFeedback(null), 600);
  }, []);

  // --- Skip animation state ---
  const [skipAnimation, setSkipAnimation] = useState<{ side: "left" | "right"; key: number } | null>(null);
  const skipKeyRef = useRef(0);

  // 중앙 탭 — 즉시 재생/일시정지 (딜레이 없음)
  const handleCenterTap = useCallback(() => {
    if (phase === "intro") return;
    const wasPlaying = isPlaying;
    togglePlay();
    showTapFeedback(wasPlaying ? "pause" : "play");
    resetControlsTimer();
  }, [phase, isPlaying, togglePlay, showTapFeedback, resetControlsTimer]);

  // 좌측 더블탭 — 5초 뒤로
  const handleLeftDoubleTap = useCallback(() => {
    if (phase === "intro") return;
    skip(-5);
    skipKeyRef.current += 1;
    setSkipAnimation({ side: "left", key: skipKeyRef.current });
    setTimeout(() => setSkipAnimation(null), 600);
    resetControlsTimer();
  }, [phase, skip, resetControlsTimer]);

  // 우측 더블탭 — 5초 앞으로
  const handleRightDoubleTap = useCallback(() => {
    if (phase === "intro") return;
    skip(5);
    skipKeyRef.current += 1;
    setSkipAnimation({ side: "right", key: skipKeyRef.current });
    setTimeout(() => setSkipAnimation(null), 600);
    resetControlsTimer();
  }, [phase, skip, resetControlsTimer]);

  // --- Seekbar drag ---
  const seekbarRef = useRef<HTMLDivElement>(null);

  const handleSeekbarInteraction = useCallback(
    (clientX: number) => {
      const bar = seekbarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekByProgress(pct);
    },
    [seekByProgress]
  );

  const handleSeekPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleSeekbarInteraction(e.clientX);
      resetControlsTimer();
    },
    [handleSeekbarInteraction, resetControlsTimer]
  );

  const handleSeekPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 0) return;
      handleSeekbarInteraction(e.clientX);
    },
    [handleSeekbarInteraction]
  );

  // --- Intro overlay ---
  if (phase === "intro" && showIntro) {
    return (
      <div
        data-footory-player
        className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-xl bg-[#0C0C0E]"
      >
        <div className="flex aspect-[9/16] flex-col items-center justify-center gap-4 animate-fade-up">
          <p className="font-brand text-[28px] font-bold tracking-[0.12em] text-accent">
            FOOTORY
          </p>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[18px] font-bold text-text-1">{playerName}</p>
            <p className="text-[13px] text-text-2">{playerPosition}</p>
          </div>
          <div className="mt-2 h-[2px] w-16 rounded-full bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <div
      data-footory-player
      className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-xl bg-[#0C0C0E]"
      role="region"
      aria-label="영상 재생기"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={`aspect-[9/16] w-full object-cover ${showColor ? "footory-color-grade" : ""}`}
        playsInline
        muted={isMuted}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Color grading vignette overlay */}
      {showColor && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}

      {/* Cinematic letterbox bars */}
      {showCinematic && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[68px] bg-[#0C0C0E]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[68px] bg-[#8B6914]" />
        </>
      )}

      {/* Gold ring spotlight */}
      {clip.spotlight_x != null &&
        clip.spotlight_y != null &&
        showSpotlight && (
          <div
            className="pointer-events-none absolute z-10 transition-opacity duration-500"
            style={{
              left: `${clip.spotlight_x * 100}%`,
              top: `${clip.spotlight_y * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: showSpotlight ? 1 : 0,
            }}
          >
            <div
              className="h-20 w-20 rounded-full border-[3px] border-accent"
              style={{
                boxShadow:
                  "0 0 16px rgba(212,168,83,0.5), 0 0 32px rgba(212,168,83,0.2)",
              }}
            />
            <div className="mt-1 flex flex-col items-center">
              <span className="rounded-md bg-[#0C0C0E]/80 px-2 py-0.5 text-[11px] font-semibold text-accent">
                {playerName}
              </span>
              {playerPosition && (
                <span className="text-[9px] text-text-2">{playerPosition}</span>
              )}
            </div>
          </div>
        )}

      {/* Skill label chips — top left */}
      {showSkillLabels && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {skillLabels.map((label) => (
            <span
              key={label}
              className="rounded-md bg-[#1A1A1C]/90 px-2.5 py-1 text-[11px] font-medium text-text-1 backdrop-blur-sm"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp — top right */}
      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <div className="rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-stat text-[14px] tracking-wider text-white">
            {formattedTime}
            <span className="text-white/50"> / {formattedDuration}</span>
          </span>
        </div>
      </div>

      {/* Slowmo REPLAY badge — top right (below timestamp) */}
      {phase === "slowmo" && (
        <div className="pointer-events-none absolute right-3 top-9 z-10 flex items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span className="text-[11px] font-bold tracking-wide text-accent">
            느린 재생
          </span>
        </div>
      )}

      {/* ─── 3분할 터치 영역 (딜레이 없는 즉시 반응) ─── */}
      <div className="absolute inset-0 z-20 flex">
        {/* 좌 1/3: 더블탭 = 5초 뒤로 */}
        <button
          type="button"
          className="flex-1 cursor-pointer"
          onDoubleClick={handleLeftDoubleTap}
          aria-label="5초 뒤로"
        />
        {/* 중앙 1/3: 싱글탭 = 즉시 재생/일시정지 */}
        <button
          type="button"
          className="flex-1 cursor-pointer"
          onClick={handleCenterTap}
          aria-label={isPlaying ? "일시정지" : "재생"}
        />
        {/* 우 1/3: 더블탭 = 5초 앞으로 */}
        <button
          type="button"
          className="flex-1 cursor-pointer"
          onDoubleClick={handleRightDoubleTap}
          aria-label="5초 앞으로"
        />
      </div>

      {/* ─── Tap feedback icon (center, fading) ─── */}
      {tapFeedback && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center animate-[fadeInOut_0.6s_ease]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0C0C0E]/60 backdrop-blur-sm">
            {tapFeedback === "play" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#FAFAFA">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#FAFAFA">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* ─── Double-tap skip animation ─── */}
      {skipAnimation && (
        <div
          key={skipAnimation.key}
          className={`pointer-events-none absolute inset-y-0 z-30 flex w-1/2 items-center justify-center animate-[fadeInOut_0.6s_ease] ${
            skipAnimation.side === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="flex flex-col items-center gap-1 rounded-full bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-0.5">
              {skipAnimation.side === "left" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="19,20 9,12 19,4" /><line x1="5" y1="4" x2="5" y2="20" stroke="white" strokeWidth="2" /></svg>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,4 15,12 5,20" /><line x1="19" y1="4" x2="19" y2="20" stroke="white" strokeWidth="2" /></svg>
                </>
              )}
            </div>
            <span className="text-[12px] font-semibold text-white">5초</span>
          </div>
        </div>
      )}

      {/* ─── Paused state — persistent play icon ─── */}
      {!isPlaying && phase !== "intro" && phase !== "ended" && !tapFeedback && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/50 backdrop-blur-sm ring-2 ring-accent/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#FAFAFA">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
      )}

      {/* EA FC card bar — bottom */}
      {showEafc && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-10 flex items-center justify-between px-4 py-2 ${
            showCinematic ? "bottom-[68px]" : "bottom-0"
          }`}
          style={{ background: "linear-gradient(90deg, #8B6914, #D4A853)" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-stat text-[22px] font-bold text-[#0C0C0E]">
              {playerNumber ?? "—"}
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#0C0C0E]">
                {playerName}
              </span>
              <span className="text-[10px] font-medium text-[#0C0C0E]/70">
                {playerPosition}
              </span>
            </div>
          </div>
          <span className="font-brand text-[10px] font-semibold tracking-wider text-[#0C0C0E]/50">
            FOOTORY
          </span>
        </div>
      )}

      {/* FOOTORY watermark — bottom right */}
      {!showEafc && (
        <div
          className={`pointer-events-none absolute right-3 z-10 ${
            showCinematic ? "bottom-[76px]" : "bottom-12"
          }`}
        >
          <span className="font-brand text-[10px] font-semibold tracking-[0.1em] text-text-1/30">
            FOOTORY
          </span>
        </div>
      )}

      {/* ─── Bottom controls bar ─── */}
      <div
        className={`absolute inset-x-0 z-30 transition-opacity duration-300 ${
          showCinematic ? "bottom-[68px]" : "bottom-0"
        } ${phase === "ended" ? "opacity-100" : showControls ? "opacity-100" : "opacity-0"}`}
        style={{ pointerEvents: phase === "ended" || showControls ? "auto" : "none" }}
      >
        <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent px-3 pb-3 pt-8">
          {/* Seekbar */}
          <div
            ref={seekbarRef}
            className="group relative mb-2 h-11 flex items-end cursor-pointer touch-none"
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            role="slider"
            aria-label="영상 탐색"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            {/* Track background */}
            <div className="w-full h-1.5 rounded-full bg-white/20 group-active:h-2.5 transition-all">
              {/* Progress fill */}
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            {/* Thumb — 항상 표시 */}
            <div
              className="absolute bottom-0 -translate-x-1/2 h-4 w-4 rounded-full bg-accent shadow-[0_0_8px_rgba(212,168,83,0.6)] opacity-100 transition-opacity"
              style={{ left: `${progress * 100}%` }}
            />
          </div>

          {/* Time + controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mute/unmute */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
                aria-label={isMuted ? "음소거 해제" : "음소거"}
              >
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>

              {/* Time display */}
              <span className="font-stat text-[12px] tracking-wider text-white/80">
                {formattedTime}
                <span className="text-white/40"> / {formattedDuration}</span>
              </span>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
              aria-label="전체화면"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ended state overlay */}
      {phase === "ended" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0C0C0E]/50">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0C0C0E]/60 backdrop-blur-sm active:scale-95 transition-transform"
            aria-label="다시 재생"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FAFAFA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <p className="mt-3 text-[14px] font-medium text-text-1">다시 재생</p>
        </div>
      )}
    </div>
  );
}
