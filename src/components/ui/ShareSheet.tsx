"use client";

import { useState, useCallback } from "react";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  text?: string;
}

export default function ShareSheet({ open, onClose, url, title, text }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
        onClose();
      } catch {
        // user cancelled
      }
    }
  }, [url, title, text, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[430px] animate-fade-up rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-4 pb-4">
          <h3 className="mb-4 text-center text-[15px] font-bold text-text-1">공유하기</h3>

          <div className="flex flex-col gap-2">
            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-3 rounded-[10px] bg-surface px-4 py-3 text-left transition-colors active:bg-border"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-bg)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </span>
              <span className="text-[14px] font-medium text-text-1">
                {copied ? "복사됨!" : "링크 복사"}
              </span>
            </button>

            {/* Web Share API */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShare}
                className="flex items-center gap-3 rounded-[10px] bg-surface px-4 py-3 text-left transition-colors active:bg-border"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-bg)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </span>
                <span className="text-[14px] font-medium text-text-1">다른 앱으로 공유</span>
              </button>
            )}
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-[10px] py-3 text-[14px] font-medium text-text-3 transition-colors active:bg-surface"
          >
            취소
          </button>
        </div>
      </div>
    </>
  );
}
