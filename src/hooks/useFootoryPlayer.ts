"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type PlaybackPhase = "intro" | "main" | "slowmo" | "ended";

export interface FootoryPlayerClip {
  video_url: string;
  rendered_url?: string | null;
  trim_start?: number | null;
  trim_end?: number | null;
  spotlight_x?: number | null;
  spotlight_y?: number | null;
  slowmo_start?: number | null;
  slowmo_end?: number | null;
  slowmo_speed?: number | null;
  skill_labels?: string[] | null;
  custom_labels?: string[] | null;
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  } | null;
  bgm_id?: string | null;
}

interface UseFootoryPlayerOptions {
  clip: FootoryPlayerClip;
  autoPlay?: boolean;
  compact?: boolean;
}

// BGM track URLs — extend as needed
const BGM_TRACKS: Record<string, string> = {
  epic: "/audio/bgm-epic.mp3",
  chill: "/audio/bgm-chill.mp3",
  hype: "/audio/bgm-hype.mp3",
};

export function useFootoryPlayer({ clip, autoPlay = false, compact = false }: UseFootoryPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const [phase, setPhase] = useState<PlaybackPhase>(
    clip.effects?.intro && !compact ? "intro" : "main"
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const trimStart = clip.trim_start ?? 0;
  const trimEnd = clip.trim_end ?? null;
  const hasSlowmo =
    clip.slowmo_start != null &&
    clip.slowmo_end != null &&
    clip.slowmo_start < (clip.slowmo_end ?? 0);

  const videoSrc = clip.rendered_url ?? clip.video_url;

  // Effective duration for seekbar
  const effectiveDuration = trimEnd != null ? trimEnd - trimStart : duration - trimStart;
  const relativeTime = currentTime - trimStart;
  const progress = effectiveDuration > 0 ? Math.max(0, Math.min(1, relativeTime / effectiveDuration)) : 0;

  // --- Controls auto-hide ---
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  // --- Intro phase timer ---
  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(() => {
      setPhase("main");
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  // --- Auto-play after intro ---
  useEffect(() => {
    if (phase === "main" && (autoPlay || phase === "main")) {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = trimStart;
      video.playbackRate = 1;
      video.play().catch(() => {});
      setIsPlaying(true);
      setShowSpotlight(true);
      resetControlsTimer();

      // Hide spotlight after 2 seconds
      const spotTimer = setTimeout(() => setShowSpotlight(false), 2000);
      return () => clearTimeout(spotTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // --- BGM management ---
  useEffect(() => {
    if (!clip.bgm_id || !BGM_TRACKS[clip.bgm_id]) return;

    const audio = new Audio(BGM_TRACKS[clip.bgm_id]);
    audio.loop = true;
    audio.volume = 0.5;
    bgmRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      bgmRef.current = null;
    };
  }, [clip.bgm_id]);

  // Sync BGM with video play/pause
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (isPlaying && phase !== "intro" && phase !== "ended") {
      bgm.play().catch(() => {});
    } else {
      bgm.pause();
    }
  }, [isPlaying, phase]);

  // Sync mute with BGM
  useEffect(() => {
    const bgm = bgmRef.current;
    if (bgm) bgm.muted = isMuted;
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  // --- Duration from video metadata ---
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  // --- Time update handler ---
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime;
    setCurrentTime(t);

    // Spotlight: visible in first 2 seconds of main phase
    if (phase === "main" && t - trimStart > 2) {
      setShowSpotlight(false);
    }

    if (phase === "main" && trimEnd != null && t >= trimEnd) {
      if (hasSlowmo) {
        // Transition to slowmo phase
        setPhase("slowmo");
        video.currentTime = clip.slowmo_start!;
        video.playbackRate = clip.slowmo_speed ?? 0.5;
      } else {
        video.pause();
        setIsPlaying(false);
        setPhase("ended");
        bgmRef.current?.pause();
      }
    }

    if (phase === "slowmo" && clip.slowmo_end != null && t >= clip.slowmo_end) {
      video.pause();
      video.playbackRate = 1;
      setIsPlaying(false);
      setPhase("ended");
      bgmRef.current?.pause();
    }
  }, [phase, trimStart, trimEnd, hasSlowmo, clip.slowmo_start, clip.slowmo_end, clip.slowmo_speed]);

  // --- Toggle play/pause ---
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    resetControlsTimer();

    if (phase === "ended") {
      // Restart from beginning
      setPhase(clip.effects?.intro && !compact ? "intro" : "main");
      video.currentTime = trimStart;
      video.playbackRate = 1;
      setShowSpotlight(true);
      setTimeout(() => setShowSpotlight(false), 2000);
      video.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    if (phase === "intro") return; // Don't allow toggle during intro

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [phase, trimStart, clip.effects?.intro, compact, resetControlsTimer]);

  // --- Seek to a specific time (relative to trimStart) ---
  const seek = useCallback(
    (relTime: number) => {
      const video = videoRef.current;
      if (!video) return;
      const targetTime = trimStart + Math.max(0, Math.min(effectiveDuration, relTime));
      video.currentTime = targetTime;
      setCurrentTime(targetTime);
      if (phase === "ended") {
        setPhase("main");
        video.playbackRate = 1;
      }
      resetControlsTimer();
    },
    [trimStart, effectiveDuration, phase, resetControlsTimer]
  );

  // --- Seek by progress (0~1) ---
  const seekByProgress = useCallback(
    (pct: number) => {
      seek(pct * effectiveDuration);
    },
    [seek, effectiveDuration]
  );

  // --- Skip forward/backward ---
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video || phase === "intro") return;
      const newRel = relativeTime + seconds;
      seek(newRel);
      resetControlsTimer();
    },
    [relativeTime, seek, phase, resetControlsTimer]
  );

  // --- Toggle mute ---
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    resetControlsTimer();
  }, [resetControlsTimer]);

  // --- Toggle fullscreen ---
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const container = video.closest("[data-footory-player]") as HTMLElement | null;
    const el = container ?? video;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {
        // iOS Safari fallback
        if ("webkitEnterFullscreen" in video) {
          (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
        }
      });
    }
    resetControlsTimer();
  }, [resetControlsTimer]);

  // --- Video volume (50% when BGM active) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = clip.bgm_id ? 0.5 : 1;
  }, [clip.bgm_id]);

  // Set initial time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = trimStart;
  }, [trimStart]);

  const formattedTime = formatMMSS(relativeTime);
  const formattedDuration = formatMMSS(effectiveDuration);

  return {
    videoRef,
    videoSrc,
    phase,
    currentTime,
    duration,
    relativeTime,
    progress,
    effectiveDuration,
    formattedTime,
    formattedDuration,
    isPlaying,
    isMuted,
    showSpotlight,
    showControls,
    handleTimeUpdate,
    handleLoadedMetadata,
    togglePlay,
    seek,
    seekByProgress,
    skip,
    toggleMute,
    toggleFullscreen,
    resetControlsTimer,
    trimStart,
    trimEnd,
    hasSlowmo,
  };
}

function formatMMSS(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
