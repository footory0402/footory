"use client";

import { useState } from "react";
import { generateProfilePdf, DEFAULT_PDF_OPTIONS, type PdfOptions } from "@/lib/pdf-generator";
import { toast } from "@/components/ui/Toast";
import type { Profile, Stat, Season, Achievement } from "@/lib/types";

interface ProfilePdfExportProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  profile: Profile;
  stats: Stat[];
  seasons: Season[];
  achievements: Achievement[];
}

const OPTION_LABELS: { key: keyof PdfOptions; label: string }[] = [
  { key: "includeBasicInfo", label: "기본 정보 (사진, 이름, 포지션, 신체)" },
  { key: "includeSeasons", label: "시즌 히스토리" },
  { key: "includeStats", label: "스탯 (측정 기록)" },
  { key: "includeSkillTags", label: "스킬 태그" },
  { key: "includeMvp", label: "MVP 기록" },
  { key: "includeAchievements", label: "수상/성과" },
  { key: "includeVideoQr", label: "대표 영상 QR코드" },
];

function canSharePdfFile(file: File) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

function isShareAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function triggerPdfDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function ProfilePdfExport({
  open,
  onClose,
  loading = false,
  profile,
  stats,
  seasons,
  achievements,
}: ProfilePdfExportProps) {
  const [options, setOptions] = useState<PdfOptions>({ ...DEFAULT_PDF_OPTIONS });
  const [generating, setGenerating] = useState(false);

  if (!open) return null;

  const toggleOption = (key: keyof PdfOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await generateProfilePdf(profile, stats, [], seasons, achievements, options);
      const fileName = `${profile.handle}_profile.pdf`;

      // Try sharing, fallback to download
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (canSharePdfFile(file)) {
        try {
          await navigator.share({
            title: `${profile.name} — Footory`,
            files: [file],
          });
        } catch (error) {
          if (isShareAbortError(error)) {
            return;
          }

          triggerPdfDownload(blob, fileName);
        }
      } else {
        triggerPdfDownload(blob, fileName);
      }

      toast("PDF가 생성되었습니다", "success");
      onClose();
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast("PDF 생성에 실패했습니다", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <h2 className="mb-1 text-lg font-bold text-text-1">프로필 내보내기 (PDF)</h2>
          <p className="mb-5 text-[12px] text-text-3">포함할 항목을 선택하세요</p>

          <div className="space-y-3">
            {OPTION_LABELS.map(({ key, label }) => (
              <label
                key={key}
                onClick={() => toggleOption(key)}
                className="flex cursor-pointer items-center gap-3"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    options[key]
                      ? "border-accent bg-accent"
                      : "border-border bg-bg"
                  }`}
                >
                  {options[key] && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0C0C0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-text-1">{label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
            >
              취소
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || loading}
              className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-bg disabled:opacity-50"
            >
              {loading ? (
                "데이터 불러오는 중..."
              ) : generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                  생성 중...
                </span>
              ) : (
                "PDF 생성"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
