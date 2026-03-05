"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

interface WatchlistPlayer {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string;
  position?: string;
}

interface WatchlistItem {
  id: string;
  player_id: string;
  note: string | null;
  notify_on_upload: boolean;
  created_at: string;
  last_clip_at: string | null;
  player: WatchlistPlayer;
}

interface Props {
  onClose?: () => void;
}

export default function WatchlistPanel({ onClose }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((d) => setItems(d.watchlist ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (playerId: string) => {
    await fetch(`/api/watchlist/${playerId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.player_id !== playerId));
  };

  const handleSaveNote = async (item: WatchlistItem) => {
    setSaving(true);
    await fetch(`/api/watchlist/${item.player_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: editNote, notify_on_upload: item.notify_on_upload }),
    });
    setItems((prev) =>
      prev.map((i) => (i.player_id === item.player_id ? { ...i, note: editNote } : i))
    );
    setEditingId(null);
    setSaving(false);
  };

  const handleToggleNotify = async (item: WatchlistItem) => {
    const next = !item.notify_on_upload;
    await fetch(`/api/watchlist/${item.player_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: item.note, notify_on_upload: next }),
    });
    setItems((prev) =>
      prev.map((i) =>
        i.player_id === item.player_id ? { ...i, notify_on_upload: next } : i
      )
    );
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-[16px] font-bold text-text-1">관심 선수</h2>
          <p className="text-[12px] text-text-3">비공개 · {items.length}명</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[14px] text-text-3 active:text-text-1"
          >
            닫기
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="py-12 text-center text-[14px] text-text-3">
            불러오는 중...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[32px]">⭐</p>
            <p className="mt-2 text-[14px] text-text-3">
              관심 선수를 추가해보세요
            </p>
            <p className="mt-0.5 text-[12px] text-text-3">
              선수 프로필에서 ⭐ 아이콘을 탭하세요
            </p>
          </div>
        )}

        {items.map((item) => {
          const p = item.player;
          const isEditing = editingId === item.player_id;

          return (
            <div key={item.id} className="border-b border-border px-4 py-4">
              {/* Player Row */}
              <div className="flex items-center gap-3">
                <Link href={`/p/${p.handle}`} className="shrink-0">
                  <div className="h-11 w-11 overflow-hidden rounded-full bg-card">
                    {p.avatar_url ? (
                      <Image
                        src={p.avatar_url}
                        alt={p.name}
                        width={44}
                        height={44}
                        sizes="44px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[14px] font-bold text-text-3">
                        {p.name[0]}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/p/${p.handle}`}
                      className="text-[14px] font-semibold text-text-1"
                    >
                      {p.name}
                    </Link>
                    {p.position && (
                      <span className="rounded bg-card px-1.5 py-0.5 text-[10px] text-text-3">
                        {p.position}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-3">@{p.handle}</p>
                  {item.last_clip_at && (
                    <p className="mt-0.5 text-[11px] text-text-3">
                      최근 영상: {relativeTime(item.last_clip_at)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={() => handleRemove(item.player_id)}
                    className="text-[11px] text-text-3 active:text-red-400"
                  >
                    제거
                  </button>
                  <button
                    onClick={() => handleToggleNotify(item)}
                    className={`text-[11px] ${item.notify_on_upload ? "text-accent" : "text-text-3"}`}
                  >
                    🔔 알림{item.notify_on_upload ? " ON" : " OFF"}
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="mt-3">
                {isEditing ? (
                  <div>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="메모 입력..."
                      rows={2}
                      autoFocus
                      className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
                    />
                    <div className="mt-1.5 flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-lg bg-surface py-2 text-[13px] text-text-2"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveNote(item)}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-accent py-2 text-[13px] font-semibold text-black disabled:opacity-40"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(item.player_id);
                      setEditNote(item.note ?? "");
                    }}
                    className="w-full rounded-xl border border-dashed border-border bg-surface p-2.5 text-left"
                  >
                    {item.note ? (
                      <p className="text-[13px] text-text-2">{item.note}</p>
                    ) : (
                      <p className="text-[13px] text-text-3">+ 메모 추가</p>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
