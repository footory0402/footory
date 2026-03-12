"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils";
import NotificationSettings from "@/components/notifications/NotificationSettings";

const TYPE_CONFIG: Record<string, { icon: string; fallbackUrl?: (refId: string | null) => string }> = {
  kudos: { icon: "👏", fallbackUrl: (id) => id ? `/feed#${id}` : "/" },
  comment: { icon: "💬", fallbackUrl: (id) => id ? `/feed#${id}` : "/" },
  follow: { icon: "👤", fallbackUrl: (id) => id ? `/p/${id}` : "/" },
  highlight_ready: { icon: "🎬", fallbackUrl: () => "/clips" },
  medal: { icon: "🏅", fallbackUrl: () => "/profile" },
  verified: { icon: "✅", fallbackUrl: () => "/profile" },
  verify_request: { icon: "📋", fallbackUrl: () => "/team" },
  team_album: { icon: "📸", fallbackUrl: () => "/team" },
  levelup_nudge: { icon: "⬆️", fallbackUrl: () => "/profile" },
  vote_open: { icon: "🗳️", fallbackUrl: () => "/mvp" },
  mvp_result: { icon: "🏆", fallbackUrl: () => "/mvp" },
  mvp_win: { icon: "🥇", fallbackUrl: () => "/mvp" },
};

const MVP_TYPES = new Set(["mvp_result", "mvp_win"]);

interface GroupedNotification {
  key: string;
  items: Notification[];
  latest: Notification;
  count: number;
}

function groupNotifications(items: Notification[]): GroupedNotification[] {
  const groupMap = new Map<string, Notification[]>();
  const singles: Notification[] = [];

  for (const item of items) {
    if (item.group_key) {
      const existing = groupMap.get(item.group_key);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(item.group_key, [item]);
      }
    } else {
      singles.push(item);
    }
  }

  const result: GroupedNotification[] = [];

  // 그룹된 알림
  for (const [key, groupItems] of groupMap) {
    const sorted = groupItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    result.push({
      key,
      items: sorted,
      latest: sorted[0],
      count: sorted.length,
    });
  }

  // 개별 알림
  for (const item of singles) {
    result.push({
      key: item.id,
      items: [item],
      latest: item,
      count: 1,
    });
  }

  // 최신순 정렬
  result.sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
  return result;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { items, loading, hasMore, refresh, loadMore, markAllAsRead } = useNotifications();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 진입 시 모든 알림 읽음 처리
  useEffect(() => {
    if (items.length > 0 && items.some((n) => !n.read)) {
      markAllAsRead();
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => groupNotifications(items), [items]);

  const handleTap = (group: GroupedNotification) => {
    const n = group.latest;
    // action_url 우선, 없으면 fallback
    const url = n.action_url || TYPE_CONFIG[n.type]?.fallbackUrl?.(n.reference_id);
    if (url) router.push(url);
  };

  if (showSettings) {
    return <NotificationSettings onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-[42px] z-30 flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="font-display text-lg font-bold text-text-1">알림</h2>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="px-2 py-2">
        {grouped.map((group) => {
          const n = group.latest;
          const config = TYPE_CONFIG[n.type] ?? { icon: "🔔" };
          const isMvp = MVP_TYPES.has(n.type);
          const isUnread = group.items.some((i) => !i.read);
          const title = group.count > 1
            ? `${n.title.split("님")[0]}님 외 ${group.count - 1}명`
            : n.title;

          return (
            <button
              key={group.key}
              onClick={() => handleTap(group)}
              className={`flex w-full items-start gap-3 rounded-[10px] px-4 py-3 text-left transition-colors active:bg-elevated ${
                isMvp
                  ? "mb-2 border-l-[3px] border-accent bg-card-alt"
                  : isUnread
                    ? "mb-1"
                    : "mb-1 opacity-60"
              }`}
            >
              <span className="mt-0.5 text-xl">{config.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] ${
                  isMvp
                    ? "font-bold text-accent"
                    : isUnread
                      ? "font-semibold text-text-1"
                      : "text-text-2"
                }`}>
                  {title}
                </p>
                {n.body && (
                  <p className="mt-0.5 text-xs text-text-3 line-clamp-2">{n.body}</p>
                )}
              </div>
              <span className="mt-1 shrink-0 text-xs text-text-3">
                {timeAgo(n.created_at)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full py-4 text-center text-sm text-text-3"
        >
          더 보기
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-text-3">
          <span className="text-4xl">🔔</span>
          <p className="mt-3 text-sm">아직 알림이 없습니다</p>
        </div>
      )}
    </div>
  );
}
