"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useUploadStore } from "@/stores/upload-store";

interface SpotlightPickerProps {
  file: File;
  spotlightX: number | null;
  spotlightY: number | null;
  onSpotlightChange: (x: number | null, y: number | null) => void;
}

export default function SpotlightPicker({
  file,
  spotlightX,
  spotlightY,
  onSpotlightChange,
}: SpotlightPickerProps) {
  const { profile } = useProfileContext();
  const isParent = useUploadStore((s) => s.context === "parent");
  const childName = useUploadStore((s) => s.childName);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameUrl, setFrameUrl] = useState<string>("");
  const [point, setPoint] = useState<{ x: number; y: number } | null>(
    spotlightX !== null && spotlightY !== null
      ? { x: spotlightX, y: spotlightY }
      : null
  );

  // 첫 프레임 캡처
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = 0.5;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
      URL.revokeObjectURL(url);
    };

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const clamped = {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };

      setPoint(clamped);
      onSpotlightChange(clamped.x, clamped.y);
    },
    [onSpotlightChange]
  );

  const handleClear = useCallback(() => {
    setPoint(null);
    onSpotlightChange(null, null);
  }, [onSpotlightChange]);

  return (
    <div className="flex flex-col gap-4">
      {/* 프레임 + 터치 영역 */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-black touch-none cursor-crosshair"
        onPointerDown={handleTap}
      >
        {frameUrl ? (
          <img src={frameUrl} alt="프레임" className="w-full" />
        ) : (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        )}

        {/* 골드 링 + 네임태그 */}
        {point && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          >
            {/* 골드 링 */}
            <div className="h-16 w-16 rounded-full border-3 border-accent shadow-[0_0_12px_rgba(212,168,83,0.5)]" />

            {/* 네임태그 */}
            {profile && (
              <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                <p className="text-[11px] font-bold text-accent">
                  {profile.name}
                </p>
                {profile.position && (
                  <p className="text-[10px] text-text-3">{profile.position}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 안내 + 초기화 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[12px] text-text-3">
          {point
            ? isParent
              ? `영상 속 ${childName ?? "아이"}의 위치가 표시됩니다`
              : "영상 속 내 위치가 표시됩니다"
            : isParent
              ? `영상에서 ${childName ?? "아이"}를 터치해주세요`
              : "영상에서 나를 터치해주세요"}
        </p>
        {point && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] text-text-3 underline underline-offset-2"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
