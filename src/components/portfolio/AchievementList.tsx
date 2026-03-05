"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/Card";
import EmptyCTA from "@/components/ui/EmptyCTA";
import { toast } from "@/components/ui/Toast";
import type { Achievement } from "@/lib/types";

const PRESET_TITLES = ["득점왕", "MVP", "최우수수비", "도움왕", "베스트 11"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

interface AchievementListProps {
  achievements: Achievement[];
  onAdd?: (input: { title: string; competition?: string; year?: number }) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
}

export default function AchievementList({ achievements, onAdd, onRemove }: AchievementListProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <SectionCard
        title="수상/성과"
        icon="🏅"
        onEdit={onAdd ? () => setSheetOpen(true) : undefined}
      >
        {achievements.length > 0 ? (
          <div className="divide-y divide-[var(--divider)]">
            {achievements.map((a, i) => (
              <div
                key={a.id}
                className="animate-fade-up flex items-start justify-between py-2.5"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text-1">
                    {a.competition && (
                      <span className="text-text-2">{a.year} {a.competition} · </span>
                    )}
                    {a.title}
                  </p>
                  {!a.competition && a.year && (
                    <p className="text-[11px] text-text-3">{a.year}</p>
                  )}
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(a.id)}
                    className="ml-2 shrink-0 p-1 text-text-3 transition-colors hover:text-red"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyCTA text="수상 및 성과를 추가하세요" onAction={onAdd ? () => setSheetOpen(true) : undefined} />
        )}
      </SectionCard>

      {onAdd && (
        <AchievementAddSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSave={onAdd}
        />
      )}
    </>
  );
}

function AchievementAddSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: { title: string; competition?: string; year?: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [competition, setCompetition] = useState("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const effectiveTitle = title === "custom" ? customTitle : title;

  const handleSave = async () => {
    if (!effectiveTitle.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: effectiveTitle.trim(),
        competition: competition.trim() || undefined,
        year,
      });
      toast("수상/성과가 추가되었습니다", "success");
      // Reset
      setTitle("");
      setCustomTitle("");
      setCompetition("");
      setYear(CURRENT_YEAR);
      onClose();
    } catch {
      toast("저장에 실패했습니다", "error");
    } finally {
      setSaving(false);
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
          <h2 className="mb-5 text-lg font-bold text-text-1">수상/성과 추가</h2>

          {/* Competition name */}
          <div className="mb-4">
            <label className="mb-1 block text-xs text-text-3">대회명</label>
            <input
              type="text"
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              placeholder="예: 수도권 1부 리그"
              className="w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-1 ring-border focus:ring-accent"
            />
          </div>

          {/* Award title presets */}
          <div className="mb-4">
            <label className="mb-1 block text-xs text-text-3">수상/성과</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TITLES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTitle(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    title === t
                      ? "bg-accent text-bg"
                      : "bg-bg text-text-2 ring-1 ring-border"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setTitle("custom")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  title === "custom"
                    ? "bg-accent text-bg"
                    : "bg-bg text-text-2 ring-1 ring-border"
                }`}
              >
                직접 입력
              </button>
            </div>
            {title === "custom" && (
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="수상/성과명 입력"
                className="mt-2 w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-1 ring-border focus:ring-accent"
                autoFocus
              />
            )}
          </div>

          {/* Year */}
          <div className="mb-6">
            <label className="mb-1 block text-xs text-text-3">연도</label>
            <div className="flex gap-2">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    year === y
                      ? "bg-accent text-bg"
                      : "bg-bg text-text-2 ring-1 ring-border"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !effectiveTitle.trim()}
              className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-bg disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
