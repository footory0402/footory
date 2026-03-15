"use client";

import { useState, useCallback } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";
import { getSkillLabelsByPosition, type Position } from "@/lib/skill-labels";

interface SkillLabelPickerProps {
  selected: string[];
  customLabels: string[];
  onSelectedChange: (labels: string[]) => void;
  onCustomChange: (labels: string[]) => void;
}

const MAX_CUSTOM = 2;
const MAX_CUSTOM_LENGTH = 10;

export default function SkillLabelPicker({
  selected,
  customLabels,
  onSelectedChange,
  onCustomChange,
}: SkillLabelPickerProps) {
  const { profile } = useProfileContext();
  const sections = getSkillLabelsByPosition(
    profile?.position as Position | undefined
  );

  const [customInput, setCustomInput] = useState("");

  const toggleLabel = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        onSelectedChange(selected.filter((l) => l !== id));
      } else {
        onSelectedChange([...selected, id]);
      }
    },
    [selected, onSelectedChange]
  );

  const addCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (
      !trimmed ||
      trimmed.length > MAX_CUSTOM_LENGTH ||
      customLabels.length >= MAX_CUSTOM ||
      customLabels.includes(trimmed)
    )
      return;

    onCustomChange([...customLabels, trimmed]);
    setCustomInput("");
  }, [customInput, customLabels, onCustomChange]);

  const removeCustom = useCallback(
    (label: string) => {
      onCustomChange(customLabels.filter((l) => l !== label));
    },
    [customLabels, onCustomChange]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* 카테고리별 칩 그리드 */}
      {sections.map((section) => (
        <div key={section.category}>
          <p className="mb-2 text-[12px] font-semibold text-text-3">
            {section.categoryLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {section.labels.map((label) => {
              const isSelected = selected.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`rounded-[20px] border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-[#2a2a2e] bg-[#161618] text-text-2"
                  }`}
                >
                  {label.labelKo}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 커스텀 라벨 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-text-3">
          커스텀 ({customLabels.length}/{MAX_CUSTOM})
        </p>

        {/* 기존 커스텀 칩 */}
        {customLabels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {customLabels.map((label) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-[20px] border border-accent bg-accent/10 px-3 py-1.5 text-[13px] font-medium text-accent"
              >
                {label}
                <button
                  type="button"
                  onClick={() => removeCustom(label)}
                  className="text-accent/60 hover:text-accent"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 입력 필드 */}
        {customLabels.length < MAX_CUSTOM && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_CUSTOM_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="직접 입력 (최대 10자)"
              className="flex-1 rounded-xl border border-white/[0.08] bg-card px-3 py-2 text-[13px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/30"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!customInput.trim()}
              className="rounded-xl bg-accent/10 px-4 py-2 text-[13px] font-semibold text-accent disabled:opacity-30"
            >
              추가
            </button>
          </div>
        )}
      </div>

      {/* 최소 1개 안내 */}
      {selected.length === 0 && customLabels.length === 0 && (
        <p className="text-[12px] text-text-3">
          최소 1개 이상의 스킬 라벨을 선택해주세요
        </p>
      )}
    </div>
  );
}
