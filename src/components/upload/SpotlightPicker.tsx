"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useUploadStore } from "@/stores/upload-store";

interface SpotlightPickerProps {
  file: File;
  trimStart?: number;
}

export default function SpotlightPicker({ file, trimStart }: SpotlightPickerProps) {
  const { profile } = useProfileContext();
  const isParent = useUploadStore((s) => s.context === "parent");
  const childName = useUploadStore((s) => s.childName);
  const spotlightX = useUploadStore((s) => s.spotlightX);
  const spotlightY = useUploadStore((s) => s.spotlightY);
  const setSpotlight = useUploadStore((s) => s.setSpotlight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [frameUrl, setFrameUrl] = useState<string>("");
  const [hintVisible, setHintVisible] = useState(true);

  const hasPoint = spotlightX !== null && spotlightY !== null;

  // 첫 프레임 캡처
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = trimStart !== undefined && trimStart > 0 ? trimStart : 0.5;
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
      // revoke는 cleanup에서만 수행
    };

    return () => {
      video.onloadeddata = null;
      video.onseeked = null;
      video.src = "";
      URL.revokeObjectURL(url);
    };
  }, [file, trimStart]);

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setSpotlight(x, y);
      setHintVisible(false);
    },
    [setSpotlight]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSpotlight(null, null);
      setHintVisible(true);
    },
    [setSpotlight]
  );

  const displayName = isParent ? (childName ?? "아이") : (profile?.name ?? "나");

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[14px] font-semibold text-text-1">
        주인공 위치 <span className="text-[12px] font-normal text-text-3">(선택)</span>
      </h3>

      {/* 프레임 + 터치 영역 */}
      <div
        ref={containerRef}
        className="relative overflow-visible rounded-xl bg-black touch-none cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        onPointerDown={handleTap}
        role="application"
        aria-label={isParent ? "영상에서 아이 위치 선택" : "영상에서 선수 위치 선택"}
        tabIndex={0}
      >
        {frameUrl ? (
          <img src={frameUrl} alt="영상 프레임" className="w-full rounded-xl" />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-xl bg-card">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        )}

        {/* 힌트 텍스트 */}
        {frameUrl && hintVisible && !hasPoint && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
            <div className="rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
              <p className="text-[13px] font-medium text-white/90">
                {displayName}의 위치를 탭하세요
              </p>
            </div>
          </div>
        )}

        {/* 볼드 스타일 링 */}
        {hasPoint && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${spotlightX! * 100}%`,
              top: `${spotlightY! * 100}%`,
            }}
          >
            {/* 링 */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "3.5px solid #D4A853",
                background: "radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)",
                boxShadow: "0 0 0 4px rgba(212,168,83,0.15), 0 0 16px rgba(212,168,83,0.3)",
              }}
            />

            {/* 네임태그 미리보기 */}
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-sm border border-accent/30">
              <p className="text-[12px] font-bold text-accent">{displayName}</p>
              {profile?.position && !isParent && (
                <p className="text-[10px] text-text-3">{profile.position}</p>
              )}
            </div>

            {/* X 버튼 */}
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/70 ring-1 ring-white/20 active:text-white"
              aria-label="선수 위치 초기화"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 안내 텍스트 */}
      <p className="text-[12px] text-text-3">
        {hasPoint
          ? `영상 시작 1초 동안 ${displayName}의 위치가 하이라이트됩니다`
          : "탭한 위치에 스포트라이트 링이 표시됩니다"}
      </p>
    </div>
  );
}
