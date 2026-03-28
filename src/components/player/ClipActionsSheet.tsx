"use client";

import { useState } from "react";
import { useBackClose } from "@/hooks/useBackClose";

interface ClipActionsSheetProps {
  clipId: string;
  onClose: () => void;
  onDelete: (clipId: string) => Promise<boolean>;
  onShare?: (clipId: string) => void;
  onEditTags?: (clipId: string) => void;
  onHighlightEdit?: (clipId: string) => void;
}

type View = "menu" | "confirm" | "deleting";

export default function ClipActionsSheet({
  clipId,
  onClose,
  onDelete,
  onShare,
  onEditTags,
  onHighlightEdit,
}: ClipActionsSheetProps) {
  const [view, setView] = useState<View>("menu");
  useBackClose(true, onClose);

  const handleDelete = async () => {
    setView("deleting");
    const ok = await onDelete(clipId);
    if (!ok) setView("confirm");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-2xl border-t border-white/10 bg-[#1a1a1e] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4"
        style={{ animation: "sheet-up 0.22s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        {view === "menu" && (
          <div className="flex flex-col gap-1">
            {onShare && (
              <button
                onClick={() => { onClose(); onShare(clipId); }}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] text-text-1 transition-colors active:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </span>
                공유
              </button>
            )}
            {onEditTags && (
              <button
                onClick={() => { onClose(); onEditTags(clipId); }}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] text-text-1 transition-colors active:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </span>
                태그 편집
              </button>
            )}
            {onHighlightEdit && (
              <button
                onClick={() => { onClose(); onHighlightEdit(clipId); }}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] text-text-1 transition-colors active:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </span>
                하이라이트 편집
              </button>
            )}

            {/* 구분선 */}
            <div className="my-1 h-px bg-white/8" />

            <button
              onClick={() => setView("confirm")}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] text-red-400 transition-colors active:bg-red-500/10"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </span>
              클립 삭제
            </button>
          </div>
        )}

        {(view === "confirm" || view === "deleting") && (
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <p className="mb-1 text-[17px] font-bold text-text-1">클립을 삭제할까요?</p>
            <p className="mb-6 text-center text-[13px] text-text-3">이 작업은 되돌릴 수 없어요.</p>

            <button
              onClick={handleDelete}
              disabled={view === "deleting"}
              className="mb-3 flex w-full items-center justify-center rounded-xl bg-red-500 py-3.5 text-[15px] font-bold text-white transition-all active:bg-red-600 disabled:opacity-60"
            >
              {view === "deleting" ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              ) : (
                "삭제"
              )}
            </button>
            <button
              onClick={view === "deleting" ? undefined : onClose}
              disabled={view === "deleting"}
              className="w-full rounded-xl bg-white/8 py-3.5 text-[15px] font-semibold text-text-2 transition-all active:bg-white/12 disabled:opacity-40"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
