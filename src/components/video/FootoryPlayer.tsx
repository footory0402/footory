"use client";

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
    isPlaying,
    showSpotlight,
    handleTimeUpdate,
    togglePlay,
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

  // --- Intro overlay ---
  if (phase === "intro" && showIntro) {
    return (
      <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-xl bg-[#0C0C0E]">
        <div className="flex aspect-[9/16] flex-col items-center justify-center gap-4 animate-fade-up">
          {/* FOOTORY logo */}
          <p className="font-brand text-[28px] font-bold tracking-[0.12em] text-accent">
            FOOTORY
          </p>
          {/* Player info */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[18px] font-bold text-text-1">{playerName}</p>
            <p className="text-[13px] text-text-2">{playerPosition}</p>
          </div>
          {/* Gold line decoration */}
          <div className="mt-2 h-[2px] w-16 rounded-full bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-xl bg-[#0C0C0E]"
      onClick={togglePlay}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={`aspect-[9/16] w-full object-cover ${showColor ? "footory-color-grade" : ""}`}
        playsInline
        muted={false}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
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
            {/* Ring */}
            <div
              className="h-20 w-20 rounded-full border-[3px] border-accent"
              style={{
                boxShadow:
                  "0 0 16px rgba(212,168,83,0.5), 0 0 32px rgba(212,168,83,0.2)",
              }}
            />
            {/* Name tag below ring */}
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
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
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
      <div className="absolute right-3 top-3 z-10">
        <span className="font-stat text-[13px] tracking-wider text-text-1/80">
          {formattedTime}
        </span>
      </div>

      {/* Slowmo REPLAY badge — top right (below timestamp) */}
      {phase === "slowmo" && (
        <div className="absolute right-3 top-9 z-10 flex items-center gap-1">
          <span className="text-[12px] font-bold tracking-wide text-accent">
            REPLAY
          </span>
        </div>
      )}

      {/* Play/pause indicator (tap feedback) */}
      {!isPlaying && phase !== "intro" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0C0C0E]/60 backdrop-blur-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#FAFAFA"
            >
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
      )}

      {/* EA FC card bar — bottom */}
      {showEafc && (
        <div
          className={`absolute inset-x-0 z-10 flex items-center justify-between px-4 py-2 ${
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

      {/* FOOTORY watermark — bottom right (above EA FC bar if present) */}
      {!showEafc && (
        <div
          className={`absolute right-3 z-10 ${
            showCinematic ? "bottom-[76px]" : "bottom-3"
          }`}
        >
          <span className="font-brand text-[10px] font-semibold tracking-[0.1em] text-text-1/30">
            FOOTORY
          </span>
        </div>
      )}

      {/* Ended state overlay */}
      {phase === "ended" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0C0C0E]/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0C0C0E]/60 backdrop-blur-sm">
            <svg
              width="20"
              height="20"
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
          </div>
          <p className="mt-2 text-[12px] text-text-2">탭하여 다시 재생</p>
        </div>
      )}
    </div>
  );
}
