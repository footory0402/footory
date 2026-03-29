"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, Save } from "lucide-react";

interface EditorHeaderProps {
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved";
}

export default function EditorHeader({ onSave, saveStatus }: EditorHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-white/6 bg-[#0a0a0c] px-3 py-2 md:bg-[#111114] md:px-6 md:py-3.5">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label="뒤로가기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-dim text-[10px] font-black text-white md:h-7 md:w-7 md:text-xs">
            F
          </div>
          <span className="text-[13px] font-bold tracking-tight md:text-lg">
            <span className="text-accent">카드</span>
            <span className="text-text-2"> 편집</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <Link
          href="/editor/video"
          className="flex items-center gap-1 rounded-lg bg-white/6 px-2.5 py-1.5 text-[11px] font-semibold text-white/60 transition-colors active:bg-white/10 md:gap-1.5 md:px-3 md:py-2 md:text-[12px]"
        >
          <svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">영상 에디터</span>
        </Link>
        <button
          onClick={onSave}
          disabled={saveStatus === "saving"}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-bold text-black transition-opacity active:opacity-90 disabled:opacity-50 md:gap-1.5 md:px-5 md:py-2 md:text-[13px]"
        >
          {saveStatus === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveStatus === "saved" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saveStatus === "saving" ? "저장 중" : saveStatus === "saved" ? "완료!" : "저장"}
        </button>
      </div>
    </header>
  );
}
