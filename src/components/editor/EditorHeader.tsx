"use client";

import Link from "next/link";
import { Download, Play, Loader2, Check, AlertCircle, Save } from "lucide-react";
import type { ExportStatus } from "./useExport";

interface EditorHeaderProps {
  onExportPng: () => void;
  onExportMp4: () => void;
  onSave: () => void;
  pngStatus: ExportStatus;
  mp4Status: ExportStatus;
  mp4Progress: number;
  saveStatus: "idle" | "saving" | "saved";
}

function StatusIcon({ status }: { status: ExportStatus }) {
  if (status === "capturing" || status === "encoding")
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  if (status === "done") return <Check className="h-3.5 w-3.5" />;
  if (status === "error") return <AlertCircle className="h-3.5 w-3.5" />;
  return null;
}

export default function EditorHeader({
  onExportPng,
  onExportMp4,
  onSave,
  pngStatus,
  mp4Status,
  mp4Progress,
  saveStatus,
}: EditorHeaderProps) {
  const isBusy = pngStatus !== "idle" && pngStatus !== "done" && pngStatus !== "error";
  const isMp4Busy = mp4Status !== "idle" && mp4Status !== "done" && mp4Status !== "error";

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

      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* Save */}
        <button
          onClick={onSave}
          disabled={saveStatus === "saving"}
          className="flex items-center gap-1 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15 disabled:opacity-50 md:gap-1.5 md:px-4 md:py-2 md:text-[13px]"
        >
          {saveStatus === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveStatus === "saved" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {saveStatus === "saving" ? "저장 중..." : saveStatus === "saved" ? "저장됨" : "카드 저장"}
          </span>
          <span className="sm:hidden">
            {saveStatus === "saved" ? "✓" : "저장"}
          </span>
        </button>

        {/* PNG Export */}
        <button
          onClick={onExportPng}
          disabled={isBusy}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-[11px] font-semibold text-text-2 transition-colors hover:border-white/15 hover:text-text-1 disabled:opacity-50 md:gap-1.5 md:px-4 md:py-2 md:text-[13px]"
        >
          {pngStatus === "idle" ? <Download className="h-3.5 w-3.5" /> : <StatusIcon status={pngStatus} />}
          <span className="hidden sm:inline">
            {pngStatus === "capturing" ? "캡처 중..." : pngStatus === "done" ? "완료!" : "이미지 저장"}
          </span>
          <span className="sm:hidden">
            {pngStatus === "capturing" ? "..." : pngStatus === "done" ? "✓" : "PNG"}
          </span>
        </button>

        {/* MP4 Export */}
        <button
          onClick={onExportMp4}
          disabled={isMp4Busy}
          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-accent to-[#c49a3d] px-3 py-1.5 text-[11px] font-bold text-black shadow-[0_4px_12px_rgba(212,168,83,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50 md:gap-1.5 md:px-5 md:py-2 md:text-[13px]"
        >
          {mp4Status === "idle" ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <StatusIcon status={mp4Status} />
          )}
          <span className="hidden sm:inline">
            {isMp4Busy
              ? `${mp4Progress}%`
              : mp4Status === "done"
                ? "완료!"
                : "영상 생성"}
          </span>
          <span className="sm:hidden">
            {isMp4Busy ? `${mp4Progress}%` : mp4Status === "done" ? "✓" : "MP4"}
          </span>
        </button>
      </div>
    </header>
  );
}
