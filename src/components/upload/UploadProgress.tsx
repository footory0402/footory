"use client";

import { useUploadStore } from "@/stores/upload-store";

export default function UploadProgress() {
  const { progress, status } = useUploadStore();

  if (status === "idle" || status === "done" || status === "error") return null;

  const label =
    status === "saving"
      ? "저장 중..."
      : status === "thumbnail"
      ? "썸네일 생성 중..."
      : "업로드 중...";

  const icon = status === "saving" ? "💾" : status === "thumbnail" ? "🖼️" : "📤";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-6 flex w-full max-w-[340px] flex-col items-center gap-5 rounded-2xl bg-card p-8">
        <span className="text-4xl">{icon}</span>
        <p className="text-sm font-medium text-text-1">{label}</p>

        {/* Progress bar */}
        <div className="w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-2 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-stat text-xs text-text-3">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
