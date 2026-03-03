"use client";

import { useState, useCallback } from "react";

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  profile: {
    id: string;
    handle: string;
    name: string;
    avatar_url: string | null;
    level: number;
    position: string;
  };
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
      setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [feedItemId]);

  const addComment = useCallback(async (content: string) => {
    const res = await fetch(`/api/feed/${feedItemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Refetch to get full profile info
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
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }, [feedItemId]);

  return { comments, loading, fetchComments, addComment, deleteComment };
}
