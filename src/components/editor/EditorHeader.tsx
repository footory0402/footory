"use client";

import Link from "next/link";
import { Download, Play, Loader2, Check, AlertCircle } from "lucide-react";
import type { ExportStatus } from "./useExport";

interface EditorHeaderProps {
  onExportPng: () => void;
  onExportMp4: () => void;
  pngStatus: ExportStatus;
  mp4Status: ExportStatus;
  mp4Progress: number;
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
  pngStatus,
  mp4Status,
  mp4Progress,
}: EditorHeaderProps) {
  const isBusy = pngStatus !== "idle" && pngStatus !== "done" && pngStatus !== "error";
  const isMp4Busy = mp4Status !== "idle" && mp4Status !== "done" && mp4Status !== "error";

  return (
    <header className="flex items-center justify-between border-b border-white/6 bg-[#111114] px-6 py-3.5">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dim text-sm font-black text-white">
            F
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-accent">Foot</span>
            <span className="text-text-1">ory</span>
          </span>
        </Link>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-amber-400">
          EDITOR
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onExportPng}
          disabled={isBusy}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-4 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:border-white/15 hover:text-text-1 disabled:opacity-50"
        >
          {pngStatus === "idle" ? <Download className="h-3.5 w-3.5" /> : <StatusIcon status={pngStatus} />}
          {pngStatus === "capturing" ? "캡처 중..." : pngStatus === "done" ? "완료!" : "이미지 저장"}
        </button>
        <button
          onClick={onExportMp4}
          disabled={isMp4Busy}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-[#c49a3d] px-5 py-2 text-[13px] font-bold text-black shadow-[0_4px_12px_rgba(212,168,83,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mp4Status === "idle" ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <StatusIcon status={mp4Status} />
          )}
          {isMp4Busy
            ? `${mp4Progress}%`
            : mp4Status === "done"
              ? "완료!"
              : "영상 생성"}
        </button>
      </div>
    </header>
  );
}
