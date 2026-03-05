"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Challenge {
  id: string;
  title: string;
  skill_tag: string | null;
}

interface RankingItem {
  feedItemId: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl: string | null;
  thumbnailUrl: string | null;
  kudosCount: number;
  rank: number;
}

interface Props {
  challenge: Challenge;
  open: boolean;
  onClose: () => void;
  onParticipate: () => void;
}

export default function ChallengeRanking({ challenge, open, onClose, onParticipate }: Props) {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !challenge.skill_tag) return;

    let mounted = true;

    const load = async () => {
      const supabase = createClient();
      setLoading(true);

      try {
        const { data: tagRows } = await supabase
          .from("clip_tags")
          .select("clip_id")
          .eq("tag_name", challenge.skill_tag!)
          .limit(100);

        if (!tagRows || tagRows.length === 0) {
          if (mounted) setItems([]);
          return;
        }

        const clipIds = tagRows.map((r) => r.clip_id);

        const { data: feedRows } = await supabase
          .from("feed_items")
          .select(
            `id, profile_id, metadata,
             profiles!feed_items_profile_id_fkey(name, handle, avatar_url),
             kudos(count)`
          )
          .eq("type", "highlight")
          .in("reference_id", clipIds)
          .limit(50);

        if (!feedRows) {
          if (mounted) setItems([]);
          return;
        }

        type Row = {
          id: string;
          profile_id: string;
          metadata: Record<string, unknown> | null;
          profiles: { name: string; handle: string; avatar_url: string | null } | null;
          kudos: { count: number }[];
        };

        const ranked = (feedRows as unknown as Row[])
          .map((row) => ({
            feedItemId: row.id,
            playerName: row.profiles?.name ?? "선수",
            playerHandle: row.profiles?.handle ?? "",
            playerAvatarUrl: row.profiles?.avatar_url ?? null,
            thumbnailUrl: (row.metadata?.thumbnail_url as string) ?? null,
            kudosCount: row.kudos?.[0]?.count ?? 0,
          }))
          .sort((a, b) => b.kudosCount - a.kudosCount)
          .slice(0, 10)
          .map((item, idx) => ({ ...item, rank: idx + 1 }));

        if (mounted) setItems(ranked);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [open, challenge.skill_tag]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="챌린지 랭킹 닫기"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full rounded-t-[20px] bg-[#161618] pb-safe max-h-[80vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
              🎯 챌린지 랭킹
            </div>
            <div className="mt-0.5 text-[16px] font-bold text-text-1">{challenge.title}</div>
          </div>
          <button
            type="button"
            onClick={onParticipate}
            className="rounded-[8px] px-3 py-2 text-[12px] font-bold"
            style={{ background: "var(--accent-gradient)", color: "#0C0C0E" }}
          >
            참여하기 →
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="챌린지 랭킹 닫기"
          className="absolute right-3 top-3 rounded-full p-2 text-text-2 transition-opacity active:opacity-70"
        >
          ✕
        </button>

        <div className="h-px bg-border" />

        {/* Ranking List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <span className="text-3xl">🎯</span>
              <p className="text-[14px] font-semibold text-text-1">아직 참여자가 없어요</p>
              <p className="text-[12px] text-text-3">첫 번째 참여자가 되어보세요!</p>
            </div>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-3">
              {items.map((item) => (
                <Link
                  key={item.feedItemId}
                  href={`/p/${item.playerHandle}`}
                  className="flex items-center gap-3 rounded-[10px] bg-card p-3 active:opacity-75"
                >
                  {/* Rank */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {item.rank === 1 ? (
                      <span className="text-[18px]">🎯</span>
                    ) : (
                      <span className="font-stat text-[14px] font-bold text-text-3">
                        {item.rank}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-[6px] bg-card-alt">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.playerName}
                        width={56}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[16px] opacity-30">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-text-1">
                      {item.playerName}
                    </div>
                    <div className="text-[11px] text-text-3">@{item.playerHandle}</div>
                  </div>

                  {/* Kudos */}
                  <div className="shrink-0 text-right">
                    <span className="font-stat text-[14px] font-bold" style={{ color: "var(--color-accent)" }}>
                      {item.kudosCount}
                    </span>
                    <div className="text-[10px] text-text-3">응원</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
