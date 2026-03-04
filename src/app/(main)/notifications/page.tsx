"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: string; link?: (refId: string | null) => string }> = {
  kudos: { icon: "👏", link: (id) => id ? `/feed#${id}` : "/" },
  comment: { icon: "💬", link: (id) => id ? `/feed#${id}` : "/" },
  follow: { icon: "👤", link: (id) => id ? `/p/${id}` : "/" },
  highlight_ready: { icon: "🎬", link: () => "/clips" },
  medal: { icon: "🏅", link: () => "/profile" },
  verified: { icon: "✅", link: () => "/profile" },
  verify_request: { icon: "📋", link: () => "/team" },
  team_album: { icon: "📸", link: () => "/team" },
  levelup_nudge: { icon: "⬆️", link: () => "/profile" },
  vote_open: { icon: "🗳️", link: () => "/mvp" },
  mvp_result: { icon: "🏆", link: () => "/mvp" },
  mvp_win: { icon: "🥇", link: () => "/mvp" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { items, loading, hasMore, refresh, loadMore, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTap = (n: (typeof items)[0]) => {
    if (!n.read) markAsRead(n.id);
    const config = TYPE_CONFIG[n.type];
    const link = config?.link?.(n.reference_id);
    if (link) router.push(link);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="sticky top-[42px] z-30 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-xl">
        <h2 className="font-display text-lg font-bold text-text-1">알림</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-accent"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {items.map((n) => {
          const config = TYPE_CONFIG[n.type] ?? { icon: "🔔" };
          return (
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-card ${
                !n.read ? "bg-card/50" : ""
              }`}
            >
              <span className="mt-0.5 text-xl">{config.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold text-text-1" : "text-text-2"}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-0.5 text-xs text-text-3 line-clamp-2">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-text-3">
                  {timeAgo(n.created_at)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
              )}
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

