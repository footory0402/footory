"use client";

import { useState } from "react";
import { SKILL_TAGS } from "@/lib/constants";
import TagAccordion from "./TagAccordion";
import Link from "next/link";

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
}

interface SkillsTabProps {
  tagClips: Record<string, TagClip[]>;
  loading?: boolean;
}

export default function SkillsTab({ tagClips }: SkillsTabProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const tagsWithClips = SKILL_TAGS.filter((t) => (tagClips[t.id]?.length ?? 0) > 0);
  const tagsToShow = filter
    ? SKILL_TAGS.filter((t) => t.id === filter)
    : SKILL_TAGS;

  return (
    <div className="flex flex-col gap-4">
      {/* Upload link */}
      <Link
        href="/upload"
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-card)] py-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
      >
        <span>+</span> 영상 추가
      </Link>

      {/* Filter bar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip label="전체" active={filter === null} onClick={() => setFilter(null)} />
        {tagsWithClips.map((tag) => (
          <FilterChip
            key={tag.id}
            label={`${tag.emoji} ${tag.label}`}
            active={filter === tag.id}
            onClick={() => setFilter(filter === tag.id ? null : tag.id)}
          />
        ))}
      </div>

      {/* Tag accordions */}
      {tagsToShow.map((tag, i) => (
        <div key={tag.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
          <TagAccordion
            tagId={tag.id}
            emoji={tag.emoji}
            label={tag.label}
            clips={tagClips[tag.id] ?? []}
          />
        </div>
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? "bg-accent text-bg"
          : "bg-card text-text-3 active:bg-card-alt"
      }`}
    >
      {label}
    </button>
  );
}
