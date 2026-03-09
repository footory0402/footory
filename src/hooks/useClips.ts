"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ClipWithTags {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  memo: string | null;
  highlight_status: string;
  created_at: string;
  tags: string[];
  uploaded_by_parent: boolean;
}

export function useClips() {
  const [clips, setClips] = useState<ClipWithTags[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClips = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clipsData } = await supabase
        .from("clips")
        .select("*, clip_tags(tag_name)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!clipsData) { setClips([]); return; }

      setClips(
        clipsData.map((c) => {
          const tags = (c.clip_tags as unknown as { tag_name: string }[])?.map((t) => t.tag_name) ?? [];
          return {
            id: c.id,
            video_url: c.video_url,
            thumbnail_url: c.thumbnail_url,
            duration_seconds: c.duration_seconds,
            file_size_bytes: c.file_size_bytes,
            memo: c.memo,
            highlight_status: c.highlight_status,
            created_at: c.created_at,
            tags,
            uploaded_by_parent: !!(c as unknown as { uploaded_by: string | null }).uploaded_by &&
              (c as unknown as { uploaded_by: string | null }).uploaded_by !== user.id,
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClip = useCallback(async (clipId: string) => {
    const res = await fetch(`/api/clips/${clipId}`, { method: "DELETE" });
    if (res.ok) {
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    }
    return res.ok;
  }, []);

  return { clips, loading, fetchClips, deleteClip };
}

interface FeaturedClip {
  id: string;
  clip_id: string;
  sort_order: number;
  clips: {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    highlight_start: number | null;
    highlight_end: number | null;
  };
}

export function useFeaturedClips() {
  const [featured, setFeatured] = useState<FeaturedClip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/featured");
      if (res.ok) {
        const { featured: data } = await res.json();
        setFeatured(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addFeatured = useCallback(async (clipId: string) => {
    const res = await fetch("/api/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clip_id: clipId }),
    });
    if (res.ok) await fetchFeatured();
    return res.ok;
  }, [fetchFeatured]);

  const removeFeatured = useCallback(async (clipId: string) => {
    const res = await fetch("/api/featured", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clip_id: clipId }),
    });
    if (res.ok) await fetchFeatured();
    return res.ok;
  }, [fetchFeatured]);

  return { featured, loading, fetchFeatured, addFeatured, removeFeatured };
}

interface UseTagClipsOptions {
  enabled?: boolean;
}

export function useTagClips({ enabled = true }: UseTagClipsOptions = {}) {
  const [tagClips, setTagClips] = useState<Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]>>({});
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchTagClips = useCallback(async () => {
    hasFetchedRef.current = true;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clips } = await supabase
        .from("clips")
        .select("id, video_url, thumbnail_url, duration_seconds, clip_tags(tag_name, is_top)")
        .eq("owner_id", user.id);

      if (!clips) { setTagClips({}); return; }

      const result: Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]> = {};
      clips.forEach((clip) => {
        const clipTags = (clip.clip_tags as unknown as { tag_name: string; is_top: boolean }[]) ?? [];
        clipTags.forEach((t) => {
          const tagId = t.tag_name;
          if (!result[tagId]) result[tagId] = [];
          result[tagId].push({
            id: clip.id,
            duration: clip.duration_seconds ?? 0,
            tag: t.tag_name,
            isTop: t.is_top,
            videoUrl: clip.video_url,
            thumbnailUrl: clip.thumbnail_url,
          });
        });
      });

      setTagClips(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;
    void fetchTagClips();
  }, [enabled, fetchTagClips]);

  return { tagClips, loading, fetchTagClips };
}
