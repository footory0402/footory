"use client";

import { useCallback } from "react";
import type { ClipSegment } from "./types";

interface SpotlightOverlayProps {
  clip?: ClipSegment;
  onSet: (x: number, y: number) => void;
  onCancel: () => void;
}

/**
 * 영상 위에 표시되는 스포트라이트 지정 오버레이.
 * 탭하면 해당 위치에 선수 스포트라이트를 설정.
 */
export default function SpotlightOverlay({ clip, onSet, onCancel }: SpotlightOverlayProps) {
  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      onSet(x, y);
    },
    [onSet]
  );

  return (
    <div
      className="absolute inset-0 z-20 cursor-crosshair touch-none"
      onPointerDown={handleTap}
    >
      {/* 반투명 오버레이 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 안내 텍스트 */}
      <div className="absolute inset-x-0 top-3 flex justify-center">
        <div className="flex items-center gap-2 rounded-full bg-accent/90 px-4 py-1.5 shadow-lg">
          <span className="text-[12px] font-bold text-black">
            선수 위치를 탭하세요
          </span>
        </div>
      </div>

      {/* 기존 위치 표시 */}
      {clip?.spotlightX != null && clip?.spotlightY != null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${clip.spotlightX * 100}%`,
            top: `${clip.spotlightY * 100}%`,
          }}
        >
          <div
            className="h-14 w-14 rounded-full animate-pulse"
            style={{
              border: "2px dashed rgba(212,168,83,0.5)",
              background: "radial-gradient(circle, rgba(212,168,83,0.1) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      {/* 취소 버튼 */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="pointer-events-auto rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white/70 backdrop-blur-sm active:bg-white/20"
        >
          취소
        </button>
      </div>
    </div>
  );
}
