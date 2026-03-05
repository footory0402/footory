"use client";

import { useState, useCallback } from "react";

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  parentId: string | null;
  profile: {
    id: string;
    handle: string;
    name: string;
    avatar_url: string | null;
    level: number;
    position: string;
  };
  replies?: Comment[];
}

export function useComments(feedItemId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${feedItemId}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      const flat: Comment[] = data.comments ?? [];

      // Build tree: root comments + attach replies
      const roots: Comment[] = [];
      const replyMap = new Map<string, Comment[]>();

      for (const c of flat) {
        if (!c.parentId) {
          roots.push({ ...c, replies: [] });
        } else {
          const list = replyMap.get(c.parentId) ?? [];
          list.push(c);
          replyMap.set(c.parentId, list);
        }
      }

      const tree = roots.map((r) => ({ ...r, replies: replyMap.get(r.id) ?? [] }));
      setComments(tree);
    } finally {
      setLoading(false);
    }
  }, [feedItemId]);

  const addComment = useCallback(async (content: string, parentId?: string | null) => {
    const res = await fetch(`/api/feed/${feedItemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: parentId ?? null }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await fetchComments();
    return data.comment;
  }, [feedItemId, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    const res = await fetch(`/api/feed/${feedItemId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }))
      );
    }
  }, [feedItemId]);

  // Flat total count (root + replies)
  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return { comments, loading, fetchComments, addComment, deleteComment, totalCount };
}
