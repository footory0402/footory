"use client";

import { useState } from "react";
import { toast } from "sonner";

interface StatReportSheetProps {
  open: boolean;
  statId: string;
  reportedId: string;
  onClose: () => void;
}

const REPORT_CATEGORIES = [
  { value: "fake_record", label: "허위 기록", desc: "실제와 다른 거짓 기록" },
  { value: "inappropriate", label: "부적절한 내용", desc: "비속어, 스팸 등" },
  { value: "other", label: "기타", desc: "위에 해당하지 않는 사유" },
] as const;

export default function StatReportSheet({ open, statId, reportedId, onClose }: StatReportSheetProps) {
  const [category, setCategory] = useState<string>("fake_record");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports/stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statId, reportedId, category, description }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "신고에 실패했습니다.");
        return;
      }
      toast.success("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
      onClose();
    } catch {
      toast.error("신고에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <h2 className="mb-1 text-lg font-bold text-text-1">기록 신고</h2>
          <p className="mb-5 text-xs text-text-3">허위 기록이 의심되면 신고해주세요. 검토 후 조치합니다.</p>

          {/* 카테고리 선택 */}
          <div className="flex flex-col gap-2 mb-4">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition-colors ${
                  category === cat.value
                    ? "ring-accent bg-accent/5"
                    : "ring-border bg-bg"
                }`}
              >
                <div
                  className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    category === cat.value ? "border-accent" : "border-text-3"
                  }`}
                >
                  {category === cat.value && (
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-1">{cat.label}</p>
                  <p className="text-[11px] text-text-3">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 추가 설명 */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="추가 설명 (선택사항)"
            maxLength={300}
            rows={2}
            className="mb-1 w-full resize-none rounded-xl bg-bg px-3 py-2.5 text-[13px] text-text-1 placeholder:text-text-3 ring-1 ring-border focus:outline-none focus:ring-accent"
          />
          <p className="mb-4 text-right text-[10px] text-text-3">{description.length}/300</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-red-500/90 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? "접수 중..." : "신고하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
