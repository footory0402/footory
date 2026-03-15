"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MIN_DURATION = 3;
const MAX_DURATION = 60;

interface TrimmerState {
  duration: number;
  trimStart: number;
  trimEnd: number;
  isPlaying: boolean;
  currentTime: number;
}

export function useVideoTrimmer(file: File | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<TrimmerState>({
    duration: 0,
    trimStart: 0,
    trimEnd: 0,
    isPlaying: false,
    currentTime: 0,
  });

  // 비디오 메타데이터 로드
  useEffect(() => {
    if (!file) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const dur = video.duration;
      if (!dur || !isFinite(dur)) return;

      const clampedEnd = Math.min(dur, MAX_DURATION);
      setState({
        duration: dur,
        trimStart: 0,
        trimEnd: clampedEnd,
        isPlaying: false,
        currentTime: 0,
      });
    };

    video.src = url;

    return () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const setTrimStart = useCallback(
    (t: number) => {
      setState((prev) => {
        const clamped = Math.max(0, Math.min(t, prev.trimEnd - MIN_DURATION));
        return { ...prev, trimStart: clamped };
      });
    },
    []
  );

  const setTrimEnd = useCallback(
    (t: number) => {
      setState((prev) => {
        const maxEnd = Math.min(prev.duration, prev.trimStart + MAX_DURATION);
        const minEnd = prev.trimStart + MIN_DURATION;
        const clamped = Math.max(minEnd, Math.min(t, maxEnd));
        return { ...prev, trimEnd: clamped };
      });
    },
    []
  );

  const selectedDuration = state.trimEnd - state.trimStart;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.currentTime = state.trimStart;
      video.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      video.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [state.trimStart]);

  // 루프 재생: 선택 구간 내에서만
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setState((prev) => {
      if (video.currentTime >= prev.trimEnd) {
        video.currentTime = prev.trimStart;
      }
      return { ...prev, currentTime: video.currentTime };
    });
  }, []);

  return {
    ...state,
    selectedDuration,
    videoRef,
    setTrimStart,
    setTrimEnd,
    togglePlay,
    onTimeUpdate,
  };
}
