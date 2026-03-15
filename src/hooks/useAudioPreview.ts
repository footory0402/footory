"use client";

import { useRef, useState, useCallback } from "react";

/**
 * HTML5 Audio 미리듣기 관리
 * 5초 프리뷰 후 자동 정지
 */
export function useAudioPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const play = useCallback(
    (id: string, url: string, durationMs = 5000) => {
      // 같은 트랙 재클릭 → 정지
      if (playingId === id) {
        stop();
        return;
      }

      stop();

      const audio = new Audio(url);
      audio.volume = 0.5;
      audioRef.current = audio;
      setPlayingId(id);

      audio.play().catch(() => {
        setPlayingId(null);
      });

      // 5초 후 자동 정지
      timeoutRef.current = setTimeout(() => {
        stop();
      }, durationMs);

      audio.onended = () => {
        stop();
      };
    },
    [playingId, stop]
  );

  return { playingId, play, stop };
}
