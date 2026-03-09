"use client";

import { useUploadStore } from "@/stores/upload-store";
import { SKILL_TAGS } from "@/lib/constants";

export default function TagMemoForm() {
  const { tags, memo, context, challengeTag, setTags, setMemo } = useUploadStore();
  const isParent = context === "parent";

  const toggleTag = (tagName: string) => {
    if (challengeTag && tagName === challengeTag) return;

    if (tags.includes(tagName)) {
      setTags(tags.filter((t) => t !== tagName));
    } else if (tags.length < 3) {
      setTags([...tags, tagName]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tag selection */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-1">
          기술 태그 <span className="font-normal text-text-3">({tags.length}/3)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {SKILL_TAGS.map((tag) => {
            const selected = tags.includes(tag.dbName);
            const locked = challengeTag === tag.dbName;
            return (
              <button
                key={tag.dbName}
                type="button"
                onClick={() => toggleTag(tag.dbName)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                  selected
                    ? locked
                      ? "bg-accent/80 text-bg cursor-default"
                      : "bg-accent text-bg"
                    : "bg-card text-text-2 active:bg-surface"
                }`}
              >
                {tag.emoji} {tag.label}
                {locked && " 🔒"}
              </button>
            );
          })}
        </div>
        {tags.length > 0 ? (
          <p className="mt-2 text-[11px] text-text-3">
            {tags.map((t) => {
              const tag = SKILL_TAGS.find((s) => s.dbName === t);
              return tag?.label ?? t;
            }).join(" · ")} 섹션에 추가됩니다
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-text-3">
            태그를 선택하면 프로필 하이라이트가 태그별로 정리돼요
          </p>
        )}
      </div>

      {/* Memo */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-1">메모</h3>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={
            isParent
              ? "아이에게 남기는 메모"
              : "이 영상에 대한 메모를 남겨보세요"
          }
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-right text-xs text-text-3">
          {memo.length}/200
        </span>
      </div>
    </div>
  );
}
