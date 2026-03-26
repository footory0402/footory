"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUploadStore } from "@/stores/upload-store";

interface LinkedChild {
  childId: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  position: string | null;
  level: number;
  height?: number | null;
  number?: number | null;
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
            <div key={i} className="h-20 w-40 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <span className="text-lg">👶</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text-1">연동된 아이가 없어요</p>
            <p className="text-[12px] text-text-3">설정에서 아이의 계정을 연동해주세요</p>
          </div>
        </div>
        <a
          href="/settings/children"
          className="flex items-center justify-center rounded-xl bg-accent py-3 text-[13px] font-bold text-bg active:scale-[0.99]"
        >
          아이 연동하러 가기
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-1">아이 선택</h3>
      <div className="flex flex-col gap-2">
        {children.map((child) => {
          const selected = childId === child.childId;
          const isIncomplete = !child.position || !child.number;

          return (
            <div
              key={child.childId}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                selected
                  ? "bg-accent/15 ring-2 ring-accent"
                  : "bg-card"
              }`}
            >
              {/* Profile edit link */}
              <Link
                href={`/upload/child/${child.childId}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface transition-opacity active:opacity-70"
              >
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
              </Link>

              {/* Child info — click to select for upload */}
              <button
                type="button"
                onClick={() => setChildInfo({ id: child.childId, name: child.name, handle: child.handle })}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-[13px] font-semibold truncate ${selected ? "text-accent" : "text-text-1"}`}>
                      {child.name}
                    </p>
                    {isIncomplete && (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                        미완성
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-3">
                    @{child.handle}
                    {child.position ? ` · ${child.position}` : ""}
                    {child.number ? ` · #${child.number}` : ""}
                  </p>
                </div>
              </button>

              {/* Edit button */}
              <Link
                href={`/upload/child/${child.childId}`}
                className="shrink-0 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-text-2 transition-colors active:bg-white/8"
              >
                편집
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
