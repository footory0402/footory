"use client";

import {
  type ComponentPropsWithoutRef,
  type RefObject,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

interface LazyVideoProps extends Omit<ComponentPropsWithoutRef<"video">, "ref" | "src"> {
  src: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function requestVideoPlay(videoRef: RefObject<HTMLVideoElement | null>) {
  requestAnimationFrame(() => {
    void videoRef.current?.play().catch(() => {});
  });
}

export default function LazyVideo({
  videoRef,
  src,
  poster,
  preload = "none",
  controls = true,
  playsInline = true,
  className,
  style,
  ...videoProps
}: LazyVideoProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [buffering, setBuffering] = useState(false);
  const bufferTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleLoadStart = useCallback(() => setStatus("loading"), []);
  const handleCanPlay = useCallback(() => setStatus("ready"), []);
  const handleError = useCallback(() => setStatus("error"), []);

  const handleWaiting = useCallback(() => {
    if (bufferTimer.current) clearTimeout(bufferTimer.current);
    bufferTimer.current = setTimeout(() => setBuffering(true), 300);
  }, []);

  const handlePlaying = useCallback(() => {
    if (bufferTimer.current) clearTimeout(bufferTimer.current);
    setBuffering(false);
  }, []);

  useEffect(() => {
    return () => {
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
    };
  }, []);

  return (
    <div className="relative" style={style}>
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        preload={preload}
        controls={controls}
        playsInline={playsInline}
        className={className}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        {...videoProps}
      />

      {/* 로딩 스피너 */}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}

      {/* 버퍼링 스피너 */}
      {buffering && status === "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}

      {/* 에러 */}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[11px] text-text-3">재생 불가</span>
        </div>
      )}
    </div>
  );
}
