"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import PlayerMarker from "./PlayerMarker";

interface ClipThumbnailProps {
  videoFile: File;
  captureTime: number; // 캡처할 시점 (초)
  markerX?: number;
  markerY?: number;
  playerName: string;
  playerNumber?: string;
  onMarkerChange: (x: number | undefined, y: number | undefined) => void;
}

export default function ClipThumbnail({
  videoFile, captureTime, markerX, markerY, playerName, playerNumber, onMarkerChange,
}: ClipThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameUrl, setFrameUrl] = useState<string>("");

  // 프레임 캡처
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    let captured = false;
    const capture = () => {
      if (captured || !video.videoWidth) return;
      captured = true;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.7));
      }
    };

    video.onloadeddata = () => { video.currentTime = Math.max(0.1, captureTime); };
    video.onseeked = capture;
    video.ontimeupdate = () => { if (video.currentTime > 0) capture(); };
    video.load();

    const fallback = setTimeout(() => { if (!captured && video.readyState >= 2) capture(); }, 3000);

    return () => {
      clearTimeout(fallback);
      video.onloadeddata = null;
      video.onseeked = null;
      video.ontimeupdate = null;
      video.src = "";
      URL.revokeObjectURL(url);
    };
  }, [videoFile, captureTime]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onMarkerChange(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  }, [onMarkerChange]);

  const handleRemove = useCallback(() => {
    onMarkerChange(undefined, undefined);
  }, [onMarkerChange]);

  if (!frameUrl) {
    return (
      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-white/5">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-20 w-28 shrink-0 cursor-crosshair overflow-hidden rounded-lg"
      onClick={handleTap}
    >
      <img src={frameUrl} alt="클립 프레임" className="h-full w-full object-cover" />
      {markerX !== undefined && markerY !== undefined && (
        <PlayerMarker
          x={markerX}
          y={markerY}
          playerName={playerName}
          playerNumber={playerNumber}
          onRemove={handleRemove}
        />
      )}
      {markerX === undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-[10px] text-white/60">탭하여 선수 표시</span>
        </div>
      )}
    </div>
  );
}
