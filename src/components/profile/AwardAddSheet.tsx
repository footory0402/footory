"use client";

import { useState } from "react";
import { useBackClose } from "@/hooks/useBackClose";

interface AwardAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: { title: string; detail?: string; verifier?: string }) => Promise<void>;
}

export default function AwardAddSheet({ open, onClose, onSave }: AwardAddSheetProps) {
  useBackClose(open, onClose);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [verifier, setVerifier] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(""); setDetail(""); setVerifier(""); setSaving(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        detail: detail.trim() || undefined,
        verifier: verifier.trim() || undefined,
      });
      handleClose();
    } catch {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8">
          <h2 className="mb-5 text-[16px] font-bold text-text-1">수상 / 성과 추가</h2>

          {/* 수상명 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">수상명 / 성과 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 최우수선수상, MVP"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 세부 내용 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
              세부 내용 <span className="font-normal text-text-3">(선택)</span>
            </label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="예: 전국 유소년 축구대회 2026"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 수여 기관 */}
          <div className="mb-6">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
              수여 기관 <span className="font-normal text-text-3">(선택)</span>
            </label>
            <input
              type="text"
              value={verifier}
              onChange={(e) => setVerifier(e.target.value)}
              placeholder="예: 대한축구협회"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="w-full rounded-xl py-3.5 text-[14px] font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent-gradient)", color: "#0C0C0E" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
