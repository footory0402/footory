"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUploadStore, type UploadStatus } from "@/stores/upload-store";

const ACTIVE_STATUSES: UploadStatus[] = [
  "uploading_raw",
  "uploading",
  "thumbnail",
  "saving",
  "creating_job",
  "rendering",
];

function getLabel(status: UploadStatus, progress: number): string {
  switch (status) {
    case "uploading_raw":
    case "uploading":
      return progress === 0 ? "준비 중..." : "영상 업로드 중";
    case "thumbnail":
      return "대표 이미지 만드는 중...";
    case "saving":
      return "저장 중...";
    case "creating_job":
    case "rendering":
      return "영상 처리 중";
    case "done":
      return "업로드 완료!";
    case "error":
      return "업로드 실패";
    default:
      return "";
  }
}

function getDisplayProgress(
  status: UploadStatus,
  progress: number,
  renderProgress: number
): number {
  if (status === "creating_job" || status === "rendering") {
    return renderProgress;
  }
  return progress;
}

export default function GlobalUploadIndicator() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useUploadStore((s) => s.status);
  const progress = useUploadStore((s) => s.progress);
  const renderProgress = useUploadStore((s) => s.renderProgress);

  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const isActive = ACTIVE_STATUSES.includes(status);
  const isDone = status === "done";
  const isError = status === "error";
  const shouldShow = isActive || isDone || isError;

  // Don't show on upload page itself (it has its own UI)
  const isUploadPage = pathname === "/upload";

  // Show/hide logic
  useEffect(() => {
    if (shouldShow && !isUploadPage) {
      setVisible(true);
      setDismissing(false);
    } else if (!shouldShow) {
      setVisible(false);
      setDismissing(false);
    }
  }, [shouldShow, isUploadPage]);

  // Auto-dismiss after completion
  useEffect(() => {
    if (!isDone || isUploadPage) return;

    const timer = setTimeout(() => {
      setDismissing(true);
      // Wait for exit animation then reset
      setTimeout(() => {
        useUploadStore.getState().reset();
        setVisible(false);
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isDone, isUploadPage]);

  if (!visible) return null;

  const displayProgress = getDisplayProgress(status, progress, renderProgress);
  const label = getLabel(status, progress);

  const handleTap = () => {
    if (isDone) {
      router.push("/profile");
    } else {
      router.push("/upload");
    }
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={`fixed left-1/2 z-[45] w-[calc(100%-24px)] max-w-[406px] -translate-x-1/2 rounded-2xl border border-white/[0.06] px-4 py-3 transition-all duration-300 ${
        dismissing
          ? "translate-y-4 opacity-0"
          : "animate-slide-up"
      } ${
        isDone
          ? "border-accent/20 bg-[rgba(7,7,9,0.94)]"
          : isError
            ? "border-red/20 bg-[rgba(7,7,9,0.94)]"
            : "glass-nav"
      }`}
      style={{
        bottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        {isDone ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A853"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : isError ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red/10">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F87171"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        )}

        {/* Text + progress */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="truncate text-[13px] font-semibold text-text-1">
              {label}
            </span>
            {isActive && displayProgress > 0 && (
              <span className="ml-2 shrink-0 text-[11px] font-semibold tabular-nums text-text-3">
                {displayProgress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          )}

          {/* Error hint */}
          {isError && (
            <span className="text-[11px] text-text-3">
              탭하여 다시 시도
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-text-3"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}
