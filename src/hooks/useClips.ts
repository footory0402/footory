"use client";

import { useState, useCallback } from "react";
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
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!clipsData) { setClips([]); return; }

      const clipIds = clipsData.map((c) => c.id);
      const { data: tagsData } = await supabase
        .from("clip_tags")
        .select("clip_id, tag_name")
        .in("clip_id", clipIds);

      const tagMap: Record<string, string[]> = {};
      tagsData?.forEach((t) => {
        if (!tagMap[t.clip_id]) tagMap[t.clip_id] = [];
        tagMap[t.clip_id].push(t.tag_name);
      });

      setClips(
        clipsData.map((c) => ({
          ...c,
          tags: tagMap[c.id] ?? [],
        }))
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

export function useTagClips() {
  const [tagClips, setTagClips] = useState<Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchTagClips = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clips } = await supabase
        .from("clips")
        .select("id, video_url, thumbnail_url, duration_seconds")
        .eq("owner_id", user.id);

      if (!clips) { setTagClips({}); return; }

      const clipIds = clips.map((c) => c.id);
      const { data: tags } = await supabase
        .from("clip_tags")
        .select("clip_id, tag_name, is_top")
        .in("clip_id", clipIds);

      const result: Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]> = {};
      tags?.forEach((t) => {
        const clip = clips.find((c) => c.id === t.clip_id);
        if (!clip) return;
        // Map db tag_name to SKILL_TAGS id
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

      setTagClips(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tagClips, loading, fetchTagClips };
}
