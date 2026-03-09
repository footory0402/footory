"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUploadStore } from "@/stores/upload-store";

interface LinkedChild {
  childId: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  position: string | null;
  level: number;
}

export default function ChildSelector() {
  const { childId, setChildInfo } = useUploadStore();
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/link")
      .then((r) => r.json())
      .then((data: LinkedChild[]) => {
        setChildren(data);
        // Auto-select if single child
        if (data.length === 1 && !childId) {
          setChildInfo({ id: data[0].childId, name: data[0].name, handle: data[0].handle });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-text-1">아이 선택</h3>
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-24 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="rounded-xl bg-card px-4 py-3">
        <p className="text-sm text-text-3">연동된 아이가 없습니다. 먼저 아이를 연동해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-1">아이 선택</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {children.map((child) => {
          const selected = childId === child.childId;
          return (
            <button
              key={child.childId}
              type="button"
              onClick={() => setChildInfo({ id: child.childId, name: child.name, handle: child.handle })}
              className={`flex flex-shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 transition-all ${
                selected
                  ? "bg-accent/15 ring-2 ring-accent"
                  : "bg-card active:bg-surface"
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface">
                {child.avatarUrl ? (
                  <Image
                    src={child.avatarUrl}
                    alt={child.name}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">⚽</span>
                )}
              </div>
              <div className="text-left">
                <p className={`text-[13px] font-semibold ${selected ? "text-accent" : "text-text-1"}`}>
                  {child.name}
                </p>
                <p className="text-[11px] text-text-3">@{child.handle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
