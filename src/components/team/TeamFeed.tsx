"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

interface TeamClip {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  duration: number;
  tags: string[];
  createdAt: string;
  player: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    position?: string;
    level: number;
  };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TeamFeed({ teamId }: { teamId: string }) {
  const [clips, setClips] = useState<TeamClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${teamId}/feed`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setClips(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-text-3">
        아직 팀 피드가 비어있어요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clips.map((clip) => (
        <Link
          key={clip.id}
          href={`/p/${clip.player.handle}`}
          className="flex gap-3 rounded-[10px] bg-card p-3 transition-colors active:bg-card-alt"
        >
          {/* Thumbnail */}
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-card-alt">
            {clip.thumbnailUrl ? (
              <Image
                src={clip.thumbnailUrl}
                alt={clip.title ?? ""}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg className="h-6 w-6 text-text-3" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            )}
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
              {formatDuration(clip.duration)}
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-text-1 line-clamp-1">
              {clip.title || "제목 없음"}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Avatar
                name={clip.player.name}
                imageUrl={clip.player.avatarUrl}
                size="xs"
              />
              <span className="text-[12px] text-text-2">{clip.player.name}</span>
              {clip.player.position && (
                <span className="text-[10px] text-text-3">{clip.player.position}</span>
              )}
            </div>
            {clip.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {clip.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-card-alt px-1.5 py-0.5 text-[10px] text-text-3">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-text-3">{timeAgo(clip.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
