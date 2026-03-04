"use client";

import { useState } from "react";
import { useLinkedChildren } from "@/hooks/useParent";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/Badge";
import LinkChildSheet from "@/components/parent/LinkChildSheet";
import Button from "@/components/ui/Button";

export default function ChildrenPage() {
  const { children, loading, linkChild, unlinkChild } = useLinkedChildren();
  const [showLink, setShowLink] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <h1 className="mb-6 text-[17px] font-bold text-text-1">자녀 연동 관리</h1>

      {children.length === 0 ? (
        <div className="flex flex-col items-center pt-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-3xl">
            👨‍👧
          </div>
          <p className="mt-4 text-[15px] font-semibold text-text-1">연동된 자녀가 없어요</p>
          <p className="mt-1 text-[13px] text-text-3">자녀의 핸들로 연동하세요</p>
          <Button variant="primary" className="mt-6" onClick={() => setShowLink(true)}>
            자녀 연동하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <div
              key={child.childId}
              className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4"
            >
              <Avatar
                name={child.name}
                imageUrl={child.avatarUrl ?? undefined}
                size="md"
                level={child.level}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-text-1">{child.name}</span>
                  <LevelBadge level={child.level} size="sm" />
                </div>
                <span className="text-[12px] text-text-3">@{child.handle}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`${child.name}과의 연동을 해제하시겠습니까?`)) {
                    unlinkChild(child.childId);
                  }
                }}
                className="text-[12px] text-text-3 hover:text-red"
              >
                연동 해제
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowLink(true)}
            className="w-full rounded-[10px] border border-dashed border-border py-3 text-[13px] text-text-3 hover:border-accent hover:text-accent"
          >
            + 다른 자녀 연동
          </button>
        </div>
      )}

      <LinkChildSheet open={showLink} onClose={() => setShowLink(false)} onLink={linkChild} />
    </div>
  );
}
