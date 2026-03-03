"use client";

import { useUploadStore } from "@/stores/upload-store";
import { SKILL_TAGS } from "@/lib/constants";

export default function TagMemoForm() {
  const { tags, memo, setTags, setMemo, nextStep, prevStep } = useUploadStore();

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter((t) => t !== tagName));
    } else if (tags.length < 3) {
      setTags([...tags, tagName]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tag selection */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          기술 태그 <span className="font-normal text-[var(--color-text-3)]">({tags.length}/3)</span>
        </h3>
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
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : "bg-[var(--color-card)] text-[var(--color-text-2)] active:bg-[var(--color-surface)]"
                }`}
              >
                {tag.emoji} {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Memo */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">메모</h3>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이 영상에 대한 메모를 남겨보세요"
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-3)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <span className="mt-1 block text-right text-xs text-[var(--color-text-3)]">
          {memo.length}/200
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 rounded-xl border border-[var(--color-border)] py-3.5 text-sm font-medium text-[var(--color-text-2)]"
        >
          이전
        </button>
        <button
          type="button"
          disabled={tags.length === 0}
          onClick={nextStep}
          className="flex-1 rounded-xl bg-[var(--color-accent)] py-3.5 text-sm font-bold text-[var(--color-bg)] transition-opacity disabled:opacity-40"
        >
          업로드
        </button>
      </div>
    </div>
  );
}
