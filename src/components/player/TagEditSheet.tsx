"use client";

import { useState, useCallback } from "react";
import { SKILL_TAGS } from "@/lib/constants";

interface TagEditSheetProps {
  clipId: string;
  currentTags: string[];
  onClose: () => void;
  onSave: (clipId: string, tags: string[]) => Promise<boolean>;
}

export default function TagEditSheet({ clipId, currentTags, onClose, onSave }: TagEditSheetProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [saving, setSaving] = useState(false);

  const toggleTag = useCallback((tagName: string) => {
    setTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : prev.length < 3
          ? [...prev, tagName]
          : prev
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(clipId, tags);
    setSaving(false);
    if (ok) onClose();
  };

  const hasChanged =
    tags.length !== currentTags.length ||
    tags.some((t, i) => t !== currentTags[i]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-2xl border-t border-white/10 bg-[#1a1a1e] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <h3 className="mb-1 text-[15px] font-bold text-text-1">태그 편집</h3>
        <p className="mb-4 text-[12px] text-text-3">
          태그를 선택하면 프로필 포트폴리오에 정리돼요 (최대 3개)
        </p>

        <div className="flex flex-wrap gap-2">
          {SKILL_TAGS.map((tag) => {
            const selected = tags.includes(tag.dbName);
            return (
              <button
                key={tag.dbName}
                type="button"
                onClick={() => toggleTag(tag.dbName)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                  selected
                    ? "bg-accent text-bg"
                    : "bg-[#222226] text-text-2 active:bg-[#2a2a2e]"
                }`}
              >
                {tag.emoji} {tag.label}
              </button>
            );
          })}
        </div>

        {tags.length > 0 && (
          <p className="mt-3 text-[11px] text-text-3">
            {tags.map((t) => {
              const tag = SKILL_TAGS.find((s) => s.dbName === t);
              return tag?.label ?? t;
            }).join(" · ")} 섹션에 추가됩니다
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-[13px] font-semibold text-text-2 active:bg-white/5"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="flex-1 rounded-xl bg-accent py-3 text-[13px] font-bold text-bg transition-colors disabled:bg-card-alt disabled:text-text-3"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
