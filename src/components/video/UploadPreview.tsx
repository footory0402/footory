"use client";

import { useEffect, useState } from "react";

interface UploadPreviewProps {
  file: File;
  trimStart: number;
  trimEnd: number | null;
  spotlightX: number | null;
  spotlightY: number | null;
  playerName?: string;
}

/**
 * Step 5: 업로드 프리뷰
 * 오버레이 레이아웃 미리보기 (실제 렌더 전)
 */
export default function UploadPreview({
  file,
  trimStart,
  spotlightX,
  spotlightY,
  playerName,
}: UploadPreviewProps) {
  const [frameUrl, setFrameUrl] = useState("");

  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = Math.max(trimStart, 0.5);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 시네마틱 바 프리뷰
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, 640, 20);
        ctx.fillRect(0, 340, 640, 20);

        // 골드 링 프리뷰
        if (spotlightX !== null && spotlightY !== null) {
          const x = spotlightX * 640;
          const y = spotlightY * 360;
          ctx.strokeStyle = "#D4A853";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.stroke();

          if (playerName) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(x - 30, y + 25, 60, 16);
            ctx.fillStyle = "#D4A853";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(playerName, x, y + 37);
          }
        }

        setFrameUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
      URL.revokeObjectURL(url);
    };

    return () => URL.revokeObjectURL(url);
  }, [file, trimStart, spotlightX, spotlightY, playerName]);

  if (!frameUrl) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <img src={frameUrl} alt="프리뷰" className="w-full" />
      <p className="mt-2 text-center text-[11px] text-text-3">
        실제 렌더 결과와 다를 수 있습니다
      </p>
    </div>
  );
}
