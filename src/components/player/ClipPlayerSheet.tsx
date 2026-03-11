"use client";

import { useEffect, useRef } from "react";

interface ClipPlayerSheetProps {
  videoUrl: string;
  onClose: () => void;
}

export default function ClipPlayerSheet({ videoUrl, onClose }: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // iOS Safari에서 body overflow:hidden이 작동하지 않으므로
    // position:fixed + 스크롤 위치 저장으로 대체
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-[430px] px-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full rounded-xl"
          style={{ maxHeight: "70vh" }}
        />
      </div>
    </div>
  );
}
