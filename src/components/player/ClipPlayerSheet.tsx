"use client";

import { useEffect, useRef, useState } from "react";

interface ClipPlayerSheetProps {
  videoUrl: string;
  clipId?: string;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
}

export default function ClipPlayerSheet({ videoUrl, clipId, onClose, onDelete }: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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

  const handleDelete = async () => {
    if (!clipId || !onDelete) return;
    setDeleting(true);
    const ok = await onDelete(clipId);
    setDeleting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-[430px] px-4" onClick={(e) => e.stopPropagation()}>
        {/* Top bar: close + delete */}
        <div className="absolute -top-12 right-4 left-4 flex items-center justify-between">
          {onDelete && clipId && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] text-red-400 backdrop-blur-md border border-white/10"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              삭제
            </button>
          )}
          {onDelete && clipId && confirmDelete && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-9 items-center gap-1.5 rounded-full bg-red-500/90 px-4 text-[13px] font-semibold text-white backdrop-blur-md"
              >
                {deleting ? "삭제 중..." : "영상 삭제"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex h-9 items-center rounded-full bg-white/10 px-3 text-[13px] text-white backdrop-blur-md border border-white/10"
              >
                취소
              </button>
            </div>
          )}
          {!onDelete && <div />}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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
