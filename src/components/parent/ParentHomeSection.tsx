"use client";

import { useState } from "react";
import { useLinkedChildren } from "@/hooks/useParent";
import ChildCard from "./ChildCard";
import LinkChildSheet from "./LinkChildSheet";
import ParentQuickUpload from "./ParentQuickUpload";
import type { LinkedChild } from "@/hooks/useParent";

export default function ParentHomeSection() {
  const { children, loading, linkChild, refetch } = useLinkedChildren();
  const [showLink, setShowLink] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<LinkedChild | null>(null);

  if (loading) return null;

  const handleUpload = (childId: string) => {
    const child = children.find((c) => c.childId === childId);
    if (child) setUploadTarget(child);
  };

  return (
    <div className="mb-4">
      {children.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border bg-card p-5 text-center">
          <p className="text-[14px] font-semibold text-text-1">자녀 프로필과 연동해보세요</p>
          <p className="mt-1 text-[12px] text-text-3">연동하면 영상을 올려줄 수 있어요</p>
          <button
            onClick={() => setShowLink(true)}
            className="mt-3 rounded-full bg-gradient-to-r from-accent to-accent-dim px-5 py-2 text-[13px] font-semibold text-bg"
          >
            연동하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <ChildCard key={child.childId} child={child} onUpload={handleUpload} />
          ))}
          <button
            onClick={() => setShowLink(true)}
            className="w-full rounded-[10px] border border-dashed border-border py-2.5 text-[13px] text-text-3 hover:border-accent hover:text-accent"
          >
            + 다른 자녀 연동
          </button>
        </div>
      )}

      <LinkChildSheet open={showLink} onClose={() => setShowLink(false)} onLink={linkChild} />

      {uploadTarget && (
        <ParentQuickUpload
          child={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onComplete={refetch}
        />
      )}
    </div>
  );
}
