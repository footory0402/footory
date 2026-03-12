"use client";

import { useState } from "react";
import { useLinkedChildren } from "@/hooks/useParent";
import Avatar from "@/components/ui/Avatar";
import LinkChildSheet from "@/components/parent/LinkChildSheet";
import Button from "@/components/ui/Button";

export default function ChildrenPage() {
  const { children, loading, linkChild, unlinkChild } = useLinkedChildren();
  const [showLink, setShowLink] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">자녀 연동 관리</h1>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center pt-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-3xl">
            👨‍👧
          </div>
          <p className="mt-4 text-[15px] font-semibold text-text-1">연동된 자녀가 없어요</p>
          <p className="mt-1 text-[13px] text-text-3">자녀의 주소로 연동하세요</p>
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
                
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-text-1">{child.name}</span>
                </div>
                <span className="text-[12px] text-text-3">@{child.handle}</span>
              </div>
              <button
                onClick={() => setUnlinkTarget({ id: child.childId, name: child.name })}
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

      {/* Unlink confirmation modal */}
      {unlinkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-[320px] rounded-xl bg-card p-5">
            <h3 className="text-[15px] font-bold text-text-1">연동 해제</h3>
            <p className="mt-2 text-[13px] text-text-2">
              {unlinkTarget.name}과의 연동을 해제하시겠습니까?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setUnlinkTarget(null)}
                className="flex-1 rounded-lg bg-elevated py-2.5 text-[13px] font-medium text-text-2"
              >
                취소
              </button>
              <button
                onClick={() => {
                  unlinkChild(unlinkTarget.id);
                  setUnlinkTarget(null);
                }}
                className="flex-1 rounded-lg bg-red py-2.5 text-[13px] font-bold text-white"
              >
                해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
