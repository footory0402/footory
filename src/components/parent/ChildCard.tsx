"use client";

import Link from "next/link";
import type { LinkedChild } from "@/hooks/useParent";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/Badge";
import { LEVELS } from "@/lib/constants";

interface ChildCardProps {
  child: LinkedChild;
  onUpload: (childId: string) => void;
}

export default function ChildCard({ child, onUpload }: ChildCardProps) {
  const lvl = LEVELS[Math.min(child.level, 5) - 1];

  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar
          name={child.name}
          imageUrl={child.avatarUrl ?? undefined}
          size="md"
          level={child.level}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-text-1">{child.name}</span>
            <LevelBadge level={child.level} size="sm" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-text-3">
            {child.position && <span>{child.position}</span>}
            <span>메달 {child.medalCount}개</span>
            <span>클립 {child.clipCount}개</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/p/${child.handle}`}
          className="flex-1 rounded-[10px] border border-border bg-surface py-2 text-center text-[13px] font-medium text-text-2 hover:border-accent"
        >
          프로필 보기
        </Link>
        <button
          onClick={() => onUpload(child.childId)}
          className="flex-1 rounded-[10px] bg-gradient-to-r from-accent to-accent-dim py-2 text-[13px] font-semibold text-bg"
        >
          📹 영상 올려주기
        </button>
      </div>
    </div>
  );
}
