"use client";

import { REACTIONS, type ReactionKey } from "./ReactionPicker";

interface ReactionDisplayProps {
  reactions: Partial<Record<ReactionKey, number>>;
  myReaction: ReactionKey | null;
  className?: string;
}

export default function ReactionDisplay({ reactions, myReaction, className = "" }: ReactionDisplayProps) {
  const visible = REACTIONS.filter(({ key }) => (reactions[key] ?? 0) > 0);
  if (visible.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {visible.map(({ key, emoji }) => {
        const count = reactions[key] ?? 0;
        const isMe = myReaction === key;
        return (
          <span
            key={key}
            className={`flex items-center gap-0.5 text-[12px] ${isMe ? "text-accent" : "text-text-3"}`}
          >
            <span className="text-[14px] leading-none">{emoji}</span>
            <span>{count}</span>
          </span>
        );
      })}
    </div>
  );
}
