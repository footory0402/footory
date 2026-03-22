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
      return progress === 0 ? "준비 중..." : `업로드 중 ${progress}%`;
    case "thumbnail":
      return "대표 이미지 생성 중...";
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
  if (status === "creating_job" || status === "rendering") return renderProgress;
  return progress;
}

export default function GlobalUploadIndicator() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useUploadStore((s) => s.status);
  const progress = useUploadStore((s) => s.progress);
  const renderProgress = useUploadStore((s) => s.renderProgress);

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);

  const isActive = ACTIVE_STATUSES.includes(status);
  const isDone = status === "done";
  const isError = status === "error";
  const shouldShow = isActive || isDone || isError;

  // 업로드 페이지 자체에선 숨김
  const isUploadPage = pathname === "/upload";

  useEffect(() => {
    if (shouldShow && !isUploadPage) {
      setVisible(true);
      setDismissed(false);
      setExiting(false);
    } else if (!shouldShow) {
      setVisible(false);
      setExiting(false);
    }
  }, [shouldShow, isUploadPage]);

  // 완료 후 3초 자동 사라짐
  useEffect(() => {
    if (!isDone || isUploadPage) return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        useUploadStore.getState().reset();
        setVisible(false);
        setExiting(false);
      }, 250);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isDone, isUploadPage]);

  if (!visible || dismissed) return null;

  const displayProgress = getDisplayProgress(status, progress, renderProgress);
  const label = getLabel(status, progress);

  const handleTap = () => {
    if (isDone) router.push("/profile");
    else if (isError) router.push("/upload");
    // 업로드 중엔 탭해도 페이지 이동 없음 — 진행 중인 업로드 방해 방지
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => {
      setDismissed(true);
      setVisible(false);
      setExiting(false);
    }, 250);
  };

  return (
    <div
      className={`fixed left-0 right-0 z-[60] mx-auto w-[calc(100%-16px)] max-w-[414px] transition-all duration-250 ${
        exiting
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100 animate-slide-down"
      }`}
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
    >
      <button
        type="button"
        onClick={handleTap}
        className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-lg ${
          isDone
            ? "border border-accent/25 bg-[#0D0D10]/95 backdrop-blur-xl"
            : isError
              ? "border border-red-400/20 bg-[#0D0D10]/95 backdrop-blur-xl"
              : "glass-nav border border-white/[0.06]"
        }`}
      >
        {/* 상태 아이콘 */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          {isDone ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : isError ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-400/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          ) : (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          )}
        </div>

        {/* 텍스트 + 프로그레스 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={`truncate text-[13px] font-semibold ${isDone ? "text-accent" : isError ? "text-red-400" : "text-text-1"}`}>
            {label}
          </span>
          {isActive && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* 닫기 버튼 (진행 중엔 숨김, 완료/에러 시 표시) */}
        {(isDone || isError) && (
          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-3 active:bg-white/10"
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </button>
    </div>
  );
}
