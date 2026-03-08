"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { POSITION_COLORS } from "@/lib/constants";
import type { Position } from "@/lib/constants";

interface WatchlistPreview {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string;
  position?: string;
  last_clip_at: string | null;
}

interface RisingPlayer {
  profile_id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
  weekly_change: number;
}

interface RecentHighlight {
  id: string;
  thumbnail_url: string | null;
  tags: string[];
  owner_name: string;
  owner_handle: string;
  owner_avatar: string | null;
  created_at: string;
}

export default function ScoutHome() {
  const [watchlist, setWatchlist] = useState<WatchlistPreview[]>([]);
  const [rising, setRising] = useState<RisingPlayer[]>([]);
  const [highlights, setHighlights] = useState<RecentHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/watchlist").then(r => r.json()).then(d => setWatchlist(
        (d.watchlist ?? []).slice(0, 5).map((w: any) => ({
          id: w.player_id,
          name: w.player?.name ?? "",
          handle: w.player?.handle ?? "",
          avatar_url: w.player?.avatar_url,
          position: w.player?.position,
          last_clip_at: w.last_clip_at,
        }))
      )),
      fetch("/api/discover/rising?limit=6").then(r => r.json()).then(d => setRising(d.items ?? [])),
      fetch("/api/discover/highlights?limit=6").then(r => r.json()).then(d => setHighlights(
        (d.items ?? []).map((h: any) => ({
          id: h.id,
          thumbnail_url: h.metadata?.thumbnail_url ?? null,
          tags: h.metadata?.tags ?? [],
          owner_name: h.profiles?.name ?? "",
          owner_handle: h.profiles?.handle ?? "",
          owner_avatar: h.profiles?.avatar_url ?? null,
          created_at: h.created_at ?? "",
        }))
      )),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 px-4 pt-4 pb-24">
        <div className="h-6 w-32 animate-pulse rounded bg-card" />
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-card" />)}
        </div>
        <div className="h-6 w-32 animate-pulse rounded bg-card" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-[12px] bg-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pt-4 pb-24">
      {/* Watchlist Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-text-1">⭐ 관심 선수</h2>
          <Link href="/profile/watchlist" className="text-[12px] text-accent">
            전체 보기
          </Link>
        </div>
        {watchlist.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border bg-card p-4 text-center">
            <p className="text-[13px] text-text-3">관심 선수를 추가해보세요</p>
            <p className="mt-1 text-[11px] text-text-3">선수 프로필에서 ⭐을 탭하면 추가돼요</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {watchlist.map(p => {
              const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
              return (
                <Link key={p.id} href={`/p/${p.handle}`} className="flex w-[80px] shrink-0 flex-col items-center gap-1.5">
                  <Avatar name={p.name} size="md" imageUrl={p.avatar_url} />
                  <span className="text-[11px] font-medium text-text-1 truncate w-full text-center">{p.name}</span>
                  {p.position && (
                    <span className="text-[10px]" style={{ color: posColor }}>{p.position}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Rising Players */}
      {rising.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-text-1">🚀 떠오르는 선수</h2>
            <Link href="/discover" className="text-[12px] text-accent">
              더보기
            </Link>
          </div>
          <div className="space-y-2">
            {rising.slice(0, 4).map((p, idx) => {
              const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
              return (
                <div key={p.profile_id} className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-3">
                  <span className="w-5 text-center text-[14px] font-bold text-text-3" style={{ fontFamily: "var(--font-stat)" }}>
                    {idx + 1}
                  </span>
                  <Link href={`/p/${p.handle}`} className="shrink-0">
                    <Avatar name={p.name} size="sm" level={p.level} imageUrl={p.avatar_url ?? undefined} />
                  </Link>
                  <Link href={`/p/${p.handle}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-text-1 truncate">{p.name}</span>
                      {p.position && (
                        <span className="text-[10px] rounded-full px-1.5 py-px font-medium" style={{ color: posColor, backgroundColor: `${posColor}15` }}>
                          {p.position}
                        </span>
                      )}
                    </div>
                    {p.weekly_change > 0 && (
                      <span className="text-[11px] text-green">인기 +{p.weekly_change}</span>
                    )}
                  </Link>
                  <FollowButton targetId={p.profile_id} size="sm" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Highlights */}
      {highlights.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-text-1">🎬 최신 하이라이트</h2>
            <Link href="/discover" className="text-[12px] text-accent">
              탐색
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {highlights.slice(0, 4).map(h => (
              <Link key={h.id} href={`/p/${h.owner_handle}`} className="rounded-[10px] bg-card overflow-hidden border border-border">
                <div className="aspect-video bg-card-alt relative flex items-center justify-center">
                  {h.thumbnail_url ? (
                    <img src={h.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-text-3 text-[20px]">🎬</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[12px] font-medium text-text-1 truncate">{h.owner_name}</p>
                  {h.tags.length > 0 && (
                    <p className="text-[10px] text-text-3 truncate">{h.tags.join(" · ")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/discover" className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-3">
            <span className="text-[16px]">🔍</span>
            <span className="text-[13px] font-medium text-text-2">선수 탐색</span>
          </Link>
          <Link href="/mvp" className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-3">
            <span className="text-[16px]">🏆</span>
            <span className="text-[13px] font-medium text-text-2">MVP 투표</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
