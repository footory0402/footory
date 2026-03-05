"use client";

import { useEffect, useRef } from "react";

export const REACTIONS = [
  { key: "clap",   emoji: "👏", label: "응원" },
  { key: "fire",   emoji: "🔥", label: "불타오름" },
  { key: "goal",   emoji: "⚽", label: "골" },
  { key: "strong", emoji: "💪", label: "힘내" },
  { key: "wow",    emoji: "😮", label: "놀라움" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

interface ReactionPickerProps {
  onSelect: (reaction: ReactionKey) => void;
  onClose: () => void;
}

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-1 rounded-[24px] bg-[#1E1E22] border border-border px-2 py-1.5 shadow-xl"
      role="dialog"
      aria-label="리액션 선택"
    >
      {REACTIONS.map(({ key, emoji, label }) => (
        <button
          key={key}
          onClick={() => { onSelect(key); onClose(); }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-[12px] hover:bg-white/10 transition-colors active:scale-110"
          title={label}
          aria-label={label}
        >
          <span className="text-[22px] leading-none">{emoji}</span>
        </button>
      ))}
    </div>
  );
}
