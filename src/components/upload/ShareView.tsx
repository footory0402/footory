"use client";

import { useUploadStore } from "@/stores/upload-store";
import { startUpload } from "@/lib/upload-service";

interface ShareViewProps {
  onBack: () => void;
}

export default function ShareView({ onBack }: ShareViewProps) {
  const memo = useUploadStore((s) => s.memo);
  const status = useUploadStore((s) => s.status);

  const isUploading = status !== "idle" && status !== "error";

  return (
    <div className="flex flex-col min-h-dvh bg-[#070709]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded-full p-1.5 text-white/40 active:bg-white/8"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-bold text-white">올리기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent/40" />
          <div className="h-1 w-6 rounded-full bg-accent/40" />
          <div className="h-1 w-6 rounded-full bg-accent" />
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-28 flex flex-col gap-5">
        {/* 메모 */}
        <div>
          <h3 className="text-[12px] font-semibold text-text-2 mb-2">한 줄 메모</h3>
          <textarea
            value={memo}
            onChange={(e) => useUploadStore.getState().setMemo(e.target.value)}
            placeholder="이 장면에 대해 한마디 (선택)"
            rows={2}
            maxLength={100}
            className="w-full resize-none rounded-xl bg-card px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3/50 outline-none focus:ring-1 focus:ring-accent/30"
          />
          <p className="mt-1 text-right text-[10px] text-text-3">{memo.length}/100</p>
        </div>

      </div>

      {/* 올리기 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-[#070709]/95 backdrop-blur-sm border-t border-white/[0.06]"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={() => startUpload()}
          disabled={isUploading}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg transition-opacity active:scale-[0.99] disabled:opacity-40"
        >
          {isUploading ? "업로드 중..." : "올리기"}
        </button>
      </div>
    </div>
  );
}
