"use client";

import { useState, useCallback } from "react";

export interface FollowUser {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  level: number;
  position: string;
  followedAt: string;
}

export function useFollow(targetId: string, initialFollowing = false) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const prev = isFollowing;
    setIsFollowing(!prev); // Optimistic

    const method = prev ? "DELETE" : "POST";
    const res = await fetch("/api/follows", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });

    if (!res.ok) {
      setIsFollowing(prev); // Rollback
    }

    setLoading(false);
  }, [targetId, isFollowing, loading]);

  return { isFollowing, toggle, loading };
}

export function useFollowList() {
  const [items, setItems] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async (type: "followers" | "following", profileId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (profileId) params.set("profileId", profileId);
      const res = await fetch(`/api/follows?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchList };
}
