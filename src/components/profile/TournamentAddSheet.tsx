"use client";

import { useEffect, useState } from "react";
import type { TournamentRecord } from "./CareerTabV5";
import { useBackClose } from "@/hooks/useBackClose";

interface TournamentAddSheetProps {
  open: boolean;
  onClose: () => void;
  initialValues?: TournamentRecord;
  editingId?: string;
  onSave: (input: {
    name: string;
    type: TournamentRecord["type"];
    date_text?: string;
    result?: string;
    goals?: number;
    assists?: number;
    is_mvp?: boolean;
  }) => Promise<void>;
}

const TYPES: TournamentRecord["type"][] = ["공식대회", "리그", "친선"];

export default function TournamentAddSheet({ open, onClose, initialValues, editingId, onSave }: TournamentAddSheetProps) {
  useBackClose(open, onClose);
  const [name, setName] = useState("");
  const [type, setType] = useState<TournamentRecord["type"]>("공식대회");
  const [dateText, setDateText] = useState("");
  const [result, setResult] = useState("");
  const [goals, setGoals] = useState("");
  const [assists, setAssists] = useState("");
  const [isMvp, setIsMvp] = useState(false);
  const [saving, setSaving] = useState(false);

  // 시트가 열릴 때 initialValues로 폼 채우기
  useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name);
        setType(initialValues.type);
        setDateText(initialValues.dateText ?? "");
        setResult(initialValues.result ?? "");
        setGoals(initialValues.goals ? String(initialValues.goals) : "");
        setAssists(initialValues.assists ? String(initialValues.assists) : "");
        setIsMvp(initialValues.isMvp);
      } else {
        setName(""); setType("공식대회"); setDateText(""); setResult("");
        setGoals(""); setAssists(""); setIsMvp(false);
      }
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const reset = () => {
    setName(""); setType("공식대회"); setDateText(""); setResult("");
    setGoals(""); setAssists(""); setIsMvp(false); setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        date_text: dateText.trim() || undefined,
        result: result.trim() || undefined,
        goals: goals ? Number(goals) : undefined,
        assists: assists ? Number(assists) : undefined,
        is_mvp: isMvp,
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

        <div className="max-h-[80vh] overflow-y-auto px-5 pb-8">
          <h2 className="mb-5 text-[16px] font-bold text-text-1">{editingId ? "대회 기록 수정" : "대회 기록 추가"}</h2>

          {/* 대회명 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">대회명 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 전국 유소년 축구대회"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 대회 유형 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">유형</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                  style={{
                    background: type === t ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${type === t ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.06)"}`,
                    color: type === t ? "var(--color-accent)" : "var(--color-text-3)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
              날짜 <span className="font-normal text-text-3">(선택)</span>
            </label>
            <input
              type="text"
              value={dateText}
              onChange={(e) => setDateText(e.target.value)}
              placeholder="예: 2026.03"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 결과 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
              결과 <span className="font-normal text-text-3">(선택)</span>
            </label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="예: 8강, 준우승, 리그 3위"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* 골 / 어시스트 */}
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
                골 <span className="font-normal text-text-3">(선택)</span>
              </label>
              <input
                type="number"
                min="0"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
                도움 <span className="font-normal text-text-3">(선택)</span>
              </label>
              <input
                type="number"
                min="0"
                value={assists}
                onChange={(e) => setAssists(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* MVP 토글 */}
          <button
            type="button"
            onClick={() => setIsMvp((v) => !v)}
            className="mb-6 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors"
            style={{
              borderColor: isMvp ? "var(--color-accent)" : "var(--color-border)",
              background: isMvp ? "rgba(212,168,83,0.08)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[16px]">🏆</span>
              <p className="text-[13px] font-semibold text-text-1">MVP 수상</p>
            </div>
            <div
              className="flex h-6 w-11 items-center rounded-full px-0.5 transition-all"
              style={{ background: isMvp ? "var(--color-accent)" : "var(--color-border)" }}
            >
              <div
                className="h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isMvp ? "translateX(20px)" : "translateX(0)" }}
              />
            </div>
          </button>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full rounded-xl py-3.5 text-[14px] font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent-gradient)", color: "#0C0C0E" }}
          >
            {saving ? "저장 중..." : editingId ? "수정 완료" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
