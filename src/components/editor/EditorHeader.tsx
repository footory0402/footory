"use client";

import Link from "next/link";
import { Loader2, Check, Save } from "lucide-react";

interface EditorHeaderProps {
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved";
}

export default function EditorHeader({ onSave, saveStatus }: EditorHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/6 bg-[#111114] px-3 py-2.5 md:px-6 md:py-3.5">
      <div className="flex items-center gap-2 md:gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dim text-xs font-black text-white md:h-8 md:w-8 md:text-sm">
            F
          </div>
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">
            <span className="text-accent">Foot</span>
            <span className="text-text-1">ory</span>
          </span>
        </Link>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-amber-400 md:px-2.5 md:text-[10px]">
          EDITOR
        </span>
      </div>

      <button
        onClick={onSave}
        disabled={saveStatus === "saving"}
        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50 md:px-5"
      >
        {saveStatus === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saveStatus === "saved" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saveStatus === "saving" ? "저장 중..." : saveStatus === "saved" ? "저장됨!" : "카드 저장"}
      </button>
    </header>
  );
}
