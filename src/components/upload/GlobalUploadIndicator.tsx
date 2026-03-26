"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUploadStore, type UploadStatus } from "@/stores/upload-store";
import { startR2BackgroundUpload } from "@/lib/upload-service";

const ACTIVE_STATUSES: UploadStatus[] = [
  "composing",
  "uploading_raw",
  "uploading",
  "thumbnail",
  "saving",
  "creating_job",
  "rendering",
];

function getLabel(status: UploadStatus, progress: number): string {
  switch (status) {
    case "composing":
      return progress === 0 ? "인트로 카드 합성 준비 중..." : `인트로 카드 합성 중 ${progress}%`;
    case "uploading_raw":
    case "uploading":
      return progress === 0 ? "업로드 준비 중..." : `업로드 중 ${progress}%`;
    case "thumbnail":
      return "썸네일 생성 중...";
    case "saving":
      return "저장 중...";
    case "creating_job":
    case "rendering":
      return "영상 처리 중...";
    case "done":
      return "업로드 완료! — 탭하여 확인하기";
    case "error": {
      const retryCount = useUploadStore.getState().r2RetryCount;
      return retryCount >= 3
        ? "업로드 실패 — 탭하여 다시 시작"
        : "업로드 실패 — 탭하여 재시도";
    }
    default:
      return "";
  }
}

export default function GlobalUploadIndicator() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useUploadStore((s) => s.status);
  const progress = useUploadStore((s) => s.progress);
  const renderProgress = useUploadStore((s) => s.renderProgress);

  const [dismissed, setDismissed] = useState(false);
  const dismissedStatusRef = useRef<UploadStatus | null>(null);

  const isActive = ACTIVE_STATUSES.includes(status);
  const isDone = status === "done";
  const isError = status === "error";
  const shouldShow = isActive || isDone || isError;

  // 새로운 upload 사이클이 시작되면 dismissed 리셋
  useEffect(() => {
    if (isActive) {
      setDismissed(false);
      dismissedStatusRef.current = null;
    }
  }, [isActive]);

  // 완료 후 4초 자동 리셋
  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => {
      useUploadStore.getState().reset();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isDone]);

  const displayProgress =
    status === "creating_job" || status === "rendering" ? renderProgress : progress;

  const handleTap = () => {
    if (isError) {
      const s = useUploadStore.getState();
      const retryCount = s.r2RetryCount;
      if (retryCount >= 3) {
        // 3회 초과 — 처음부터 다시
        s.reset();
        router.push("/upload");
        return;
      }
      // 직접 재시도 — 새 presigned URL로 R2 업로드 재시작
      s.setR2RetryCount(retryCount + 1);
      s.setError(null);
      s.setStatus("uploading");
      s.setProgress(0);
      startR2BackgroundUpload();
    } else if (isDone) {
      useUploadStore.getState().reset();
      router.push("/profile");
    }
    // 업로드 중엔 탭해도 무시 — 업로드 방해 방지
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) {
      setDismissed(true);
      if (isDone) useUploadStore.getState().reset();
      // 에러 상태에서는 reset하지 않음 — 파일 보존하여 재시도 가능
    }
  };

  if (!shouldShow || dismissed) return null;

  return (
    <>
      {/* ── 헤더 바닥 진행 바 (항상 표시 — 얇고 눈에 잘 띄는 위치) ── */}
      <div
        className="fixed left-0 right-0 z-[70]"
        style={{ top: "calc(44px + env(safe-area-inset-top, 0px))" }}
      >
        {/* 진행 바 */}
        <div className="h-[2px] w-full overflow-hidden bg-white/[0.04]">
          <div
            className={`h-full transition-all duration-500 ${
              isDone
                ? "bg-accent"
                : isError
                  ? "bg-red-400"
                  : "bg-accent"
            }`}
            style={{
              width: isActive
                ? `${Math.max(displayProgress, 2)}%`
                : isDone
                  ? "100%"
                  : "0%",
            }}
          />
        </div>

        {/* ── 알림 카드 (헤더 바로 아래) ── */}
        <div className="flex justify-center px-2 pt-1.5">
          <div
            role="button"
            tabIndex={0}
            onClick={handleTap}
            onKeyDown={(e) => e.key === "Enter" && handleTap()}
            className={`flex w-full max-w-[414px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 shadow-xl backdrop-blur-xl ${
              isDone
                ? "border border-accent/30 bg-[#0D0D10]/96"
                : isError
                  ? "border border-red-400/25 bg-[#0D0D10]/96"
                  : "border border-white/[0.08] bg-[#111115]/96"
            }`}
          >
            {/* 아이콘 */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
              {isDone ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : isError ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-400/15">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              ) : (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
              )}
            </div>

            {/* 텍스트 */}
            <span
              className={`flex-1 truncate text-[12px] font-semibold ${
                isDone ? "text-accent" : isError ? "text-red-400" : "text-text-1"
              }`}
            >
              {getLabel(status, progress)}
            </span>

            {/* 닫기 버튼 */}
            {(isDone || isError) && (
              <button
                type="button"
                onClick={handleClose}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-3 active:bg-white/10"
                aria-label="닫기"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
