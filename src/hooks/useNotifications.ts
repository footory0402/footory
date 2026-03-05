"use client";

import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  reference_id: string | null;
  read: boolean;
  group_key: string | null;
  action_url: string | null;
  created_at: string;
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const url = reset || !cursor
        ? "/api/notifications"
        : `/api/notifications?cursor=${encodeURIComponent(cursor)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: Notification[] = data.items ?? [];

      setItems((prev) => reset ? newItems : [...prev, ...newItems]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchNotifications(false);
  }, [fetchNotifications, loading, hasMore]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const prev = items;
    setItems((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
    if (!res.ok) setItems(prev);
  }, [items]);

  const markAllAsRead = useCallback(async () => {
    const prev = items;
    setItems((s) => s.map((n) => ({ ...n, read: true })));
    const res = await fetch("/api/notifications/read", { method: "PUT" });
    if (!res.ok) setItems(prev);
  }, [items]);

  return { items, loading, hasMore, refresh, loadMore, markAsRead, markAllAsRead };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  return { count, fetchCount, setCount };
}
