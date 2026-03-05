"use client";

import type { LinkedChild } from "@/hooks/useParent";

interface ChildSelectorProps {
  childList: LinkedChild[];
  selectedId: string;
  onSelect: (childId: string) => void;
}

export default function ChildSelector({ childList, selectedId, onSelect }: ChildSelectorProps) {
  if (childList.length <= 1) return null;

  return (
    <div className="mb-4 flex gap-2">
      {childList.map((child) => {
        const active = child.childId === selectedId;
        return (
          <button
            key={child.childId}
            onClick={() => onSelect(child.childId)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              active
                ? "bg-accent text-bg"
                : "bg-card text-text-3 hover:text-text-2"
            }`}
          >
            {child.name}
          </button>
        );
      })}
    </div>
  );
}
