"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { FollowUser } from "@/hooks/useFollow";

export default function NewConversationSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (userId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/follows?type=following")
      .then((r) => r.json())
      .then((d) => setFollowing(d.items ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = search
    ? following.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.handle.toLowerCase().includes(search.toLowerCase())
      )
    : following;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={onClose} className="text-sm text-text-2">
          취소
        </button>
        <h3 className="font-display text-base font-bold text-text-1">
          새 대화
        </h3>
        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-card px-3 h-[44px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 @핸들 검색"
            className="flex-1 bg-transparent text-sm text-text-1 placeholder:text-text-3 outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">
            {search ? "검색 결과가 없습니다" : "팔로잉 목록이 비어있습니다"}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-bold text-text-2">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[14px] font-medium text-text-1">{user.name}</p>
                  <p className="text-[12px] text-text-3">@{user.handle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
