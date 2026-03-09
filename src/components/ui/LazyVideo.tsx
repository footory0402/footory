import type { ComponentPropsWithoutRef, RefObject } from "react";

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
  ...props
}: LazyVideoProps) {
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster ?? undefined}
      preload={preload}
      controls={controls}
      playsInline={playsInline}
      {...props}
    />
  );
}
