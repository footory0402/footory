"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { POSITION_COLORS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import type {
  ScoutHomeData,
  ScoutRecentHighlight,
  ScoutRisingPlayer,
  ScoutWatchlistPreview,
} from "@/lib/home-types";

interface ScoutHomeProps {
  initialData?: ScoutHomeData;
}

export default function ScoutHome({ initialData }: ScoutHomeProps) {
  const [watchlist, setWatchlist] = useState<ScoutWatchlistPreview[]>(
    () => initialData?.watchlist ?? []
  );
  const [rising, setRising] = useState<ScoutRisingPlayer[]>(
    () => initialData?.rising ?? []
  );
  const [highlights, setHighlights] = useState<ScoutRecentHighlight[]>(
    () => initialData?.highlights ?? []
  );
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      return;
    }

    Promise.allSettled([
      fetch("/api/watchlist")
        .then((response) => response.json())
        .then((data) => setWatchlist(parseWatchlistItems(data.watchlist))),
      fetch("/api/discover/rising?limit=6")
        .then((response) => response.json())
        .then((data) => setRising(parseRisingItems(data.items))),
      fetch("/api/discover/highlights?limit=6")
        .then((response) => response.json())
        .then((data) => setHighlights(parseHighlightItems(data.items))),
    ]).finally(() => setLoading(false));
  }, [initialData]);

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
      {/* Quick Links — TOP: scout needs fast access to discovery */}
      <section>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/discover"
            className="flex items-center gap-2.5 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3.5"
          >
            <span className="text-[18px]">🔍</span>
            <span className="text-[13px] font-semibold text-accent">선수 탐색</span>
          </Link>
          <Link
            href="/mvp"
            className="flex items-center gap-2.5 rounded-xl bg-card border border-border px-4 py-3.5"
          >
            <span className="text-[18px]">🏆</span>
            <span className="text-[13px] font-semibold text-text-2">MVP 순위</span>
          </Link>
        </div>
      </section>

      {/* Watchlist Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-1">⭐ 관심 선수</h2>
          <Link href="/profile/watchlist" className="text-xs text-accent">
            전체 보기
          </Link>
        </div>
        {watchlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-sm font-medium text-text-2 mb-1">아직 관심 선수가 없어요</p>
            <p className="text-xs text-text-3 mb-4">선수 프로필에서 ⭐을 탭하면 추가돼요</p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg"
            >
              선수 탐색하기
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {watchlist.map(p => {
              const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
              return (
                <Link key={p.id} href={`/p/${p.handle}`} className="flex w-[80px] shrink-0 flex-col items-center gap-1.5">
                  <Avatar name={p.name} size="md" imageUrl={p.avatar_url} />
                  <span className="text-xs font-medium text-text-1 truncate w-full text-center">{p.name}</span>
                  {p.position && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ color: posColor, backgroundColor: `${posColor}15` }}
                    >
                      {p.position}
                    </span>
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
            <h2 className="text-base font-semibold text-text-1">🚀 떠오르는 선수</h2>
            <Link href="/discover" className="text-xs text-accent">
              더보기
            </Link>
          </div>
          <div className="space-y-2">
            {rising.slice(0, 5).map((p, idx) => {
              const posColor = POSITION_COLORS[p.position as Position] ?? "#A1A1AA";
              return (
                <div key={p.profile_id} className="card-elevated flex items-center gap-3 px-4 py-3">
                  <span className="w-5 shrink-0 text-center font-stat text-base font-bold text-text-3">
                    {idx + 1}
                  </span>
                  <Link href={`/p/${p.handle}`} className="shrink-0">
                    <Avatar name={p.name} size="sm" level={p.level} imageUrl={p.avatar_url ?? undefined} />
                  </Link>
                  <Link href={`/p/${p.handle}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text-1 truncate">{p.name}</span>
                      {p.position && (
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-stat font-medium"
                          style={{ color: posColor, backgroundColor: `${posColor}15` }}
                        >
                          {p.position}
                        </span>
                      )}
                    </div>
                    {p.weekly_change > 0 && (
                      <span className="text-xs text-green">인기 +{p.weekly_change}</span>
                    )}
                  </Link>
                  {/* Scout uses "⭐ 관심" instead of follow */}
                  <Link
                    href="/profile/watchlist"
                    className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                  >
                    ⭐ 관심
                  </Link>
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
            <h2 className="text-base font-semibold text-text-1">🎬 최신 하이라이트</h2>
            <Link href="/discover" className="text-xs text-accent">
              탐색
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {highlights.slice(0, 4).map(h => (
              <Link key={h.id} href={`/p/${h.owner_handle}`} className="rounded-xl bg-card overflow-hidden border border-white/[0.05]">
                <div className="aspect-video bg-[#08080a] relative flex items-center justify-center border-b border-white/[0.03]">
                  {h.thumbnail_url ? (
                    <Image
                      src={h.thumbnail_url}
                      alt=""
                      fill
                      sizes="(max-width: 430px) 50vw, 215px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-text-3 text-[20px]">🎬</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-text-1 truncate">{h.owner_name}</p>
                  {h.tags.length > 0 && (
                    <p className="text-[10px] text-text-3 truncate mt-0.5">{h.tags.join(" · ")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function parseWatchlistItems(value: unknown): ScoutWatchlistPreview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 5).reduce<ScoutWatchlistPreview[]>((items, item) => {
      const watchlistItem = toRecord(item);
      const player = toRecord(watchlistItem.player);
      const playerId = asString(watchlistItem.player_id);

      if (!playerId) {
        return items;
      }

      items.push({
        id: playerId,
        name: asString(player.name),
        handle: asString(player.handle),
        avatar_url: asOptionalString(player.avatar_url),
        position: asOptionalString(player.position),
        last_clip_at: asNullableString(watchlistItem.last_clip_at),
      });
      return items;
    }, []);
}

function parseRisingItems(value: unknown): ScoutRisingPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const row = toRecord(item);
      const profileId = asString(row.profile_id);

      if (!profileId) {
        return null;
      }

      return {
        profile_id: profileId,
        name: asString(row.name),
        handle: asString(row.handle),
        avatar_url: asNullableString(row.avatar_url),
        position: asNullableString(row.position),
        level: asNumber(row.level, 1),
        weekly_change: asNumber(row.weekly_change, 0),
      };
    })
    .filter((item): item is ScoutRisingPlayer => item !== null);
}

function parseHighlightItems(value: unknown): ScoutRecentHighlight[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const row = toRecord(item);
      const metadata = toRecord(row.metadata);
      const profile = toRecord(row.profiles);
      const id = asString(row.id);

      if (!id) {
        return null;
      }

      return {
        id,
        thumbnail_url: asNullableString(metadata.thumbnail_url),
        tags: asStringArray(metadata.tags),
        owner_name: asString(profile.name),
        owner_handle: asString(profile.handle),
        owner_avatar: asNullableString(profile.avatar_url),
        created_at: asString(row.created_at),
      };
    })
    .filter((item): item is ScoutRecentHighlight => item !== null);
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
