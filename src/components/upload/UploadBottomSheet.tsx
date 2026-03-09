"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  challengeTag?: string;
  challengeTitle?: string;
}

export default function UploadBottomSheet({ open, onClose, challengeTag, challengeTitle }: Props) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 animate-slide-up"
      >
        <div className="rounded-t-2xl bg-card px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          {/* Handle */}
          <div className="mb-4 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-text-3/30" />
          </div>

          <h3 className="mb-4 text-base font-bold text-text-1">무엇을 올릴까요?</h3>

          <div className="flex flex-col gap-2.5">
            {/* General upload */}
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/upload");
              }}
              className="flex items-center gap-3.5 rounded-xl bg-surface px-4 py-3.5 text-left transition-colors active:bg-elevated"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-1">영상 올리기</p>
                <p className="text-[12px] text-text-3">내 하이라이트 영상 업로드</p>
              </div>
            </button>

            {/* Challenge upload */}
            {challengeTag && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/upload?challenge_tag=${encodeURIComponent(challengeTag)}`);
                }}
                className="flex items-center gap-3.5 rounded-xl bg-surface px-4 py-3.5 text-left transition-colors active:bg-elevated"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow/15">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-1">챌린지 참여하기</p>
                  <p className="text-[12px] text-accent">
                    {challengeTitle ?? `${challengeTag} 챌린지`}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2.5 text-[13px] font-medium text-text-3 transition-colors active:text-text-2"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
