"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { LEVELS, POSITION_COLORS } from "@/lib/constants";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import type { Position } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

interface FeedCardProps {
  item: FeedItemEnriched;
  onKudos: (id: string) => void;
  onComment?: (id: string) => void;
}

function FeedBody({ item }: { item: FeedItemEnriched }) {
  const meta = item.metadata as Record<string, unknown>;

  switch (item.type) {
    case "highlight": {
      // Build description from tags + memo
      const tags = (meta.tags as string[]) ?? [];
      const description = (meta.description as string) ?? (meta.memo as string) ?? null;
      const tagLine = tags.length > 0 ? tags.join(" | ") : null;
      const displayText = [tagLine, description].filter(Boolean).join(" - ");
      const thumbnailUrl =
        typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
      const duration =
        typeof meta.duration === "number" ? meta.duration : null;

      return (
        <div>
          {/* Tag + description line (replaces generic "새 하이라이트를 등록했어요") */}
          {displayText ? (
            <p className="mb-2 text-[14px] text-text-1">
              <span className="font-semibold text-accent">
                {tagLine}
              </span>
              {description && (
                <span className="text-text-2"> {description}</span>
              )}
            </p>
          ) : (
            <p className="text-[14px] text-text-1 mb-2">
              새 하이라이트를 등록했어요
            </p>
          )}
          {thumbnailUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-card-alt">
              <Image
                src={thumbnailUrl}
                alt="Highlight thumbnail"
                fill
                sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
                className="h-full w-full object-cover"
              />
              {duration !== null && (
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                  {Math.floor(duration)}초
                </span>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          {/* Tags as badges below thumbnail */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: "var(--accent-bg)",
                    color: "var(--color-accent)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "featured_change": {
      const featuredThumbnailUrl =
        typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;

      return (
        <div>
          <p className="text-[14px] text-text-1">
            대표 클립을 변경했어요
          </p>
          {featuredThumbnailUrl && (
            <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-[10px] bg-card-alt">
              <Image
                src={featuredThumbnailUrl}
                alt="Featured clip"
                fill
                sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      );
    }

    case "medal":
      return (
        <div className="flex items-center gap-3 rounded-[10px] bg-card-alt p-3">
          <span className="text-[28px]">{(meta.icon as string) ?? "\u{1F3C5}"}</span>
          <div>
            <p className="text-[14px] font-semibold text-accent">
              {(meta.label as string) ?? "메달 획득!"}
            </p>
            <p className="text-[12px] text-text-3">
              {meta.stat_type as string} {meta.value as number}{meta.unit as string}
            </p>
          </div>
        </div>
      );

    case "stat":
      return (
        <div className="rounded-[10px] bg-card-alt p-3">
          <p className="text-[14px] text-text-1 mb-1">
            새 기록을 등록했어요
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-stat text-[24px] font-bold text-accent">
              {meta.value as number}
            </span>
            <span className="text-[13px] text-text-3">{meta.unit as string}</span>
          </div>
          <p className="text-[12px] text-text-3 mt-0.5">{meta.stat_label as string}</p>
        </div>
      );

    case "top_clip":
      return (
        <p className="text-[14px] text-text-1">
          <span className="text-accent font-semibold">{meta.tag_name as string}</span> 태그의 대표 클립을 설정했어요
        </p>
      );

    case "season":
      return (
        <div className="rounded-[10px] bg-card-alt p-3">
          <p className="text-[14px] text-text-1">새 시즌을 추가했어요</p>
          <p className="text-[13px] text-text-2 mt-1">
            {meta.year as number} · {meta.team_name as string}
          </p>
        </div>
      );

    default:
      return <p className="text-[14px] text-text-3">활동이 있어요</p>;
  }
}

export default memo(function FeedCard({ item, onKudos, onComment }: FeedCardProps) {
  const lvl = LEVELS[Math.max(1, Math.min(item.playerLevel, 5)) - 1];
  const posColor = POSITION_COLORS[item.playerPosition as Position] ?? "#A1A1AA";

  return (
    <div className="rounded-[12px] bg-card p-4">
      {/* Header — player name links to profile */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/p/${item.playerHandle}`} aria-label={`${item.playerName} 프로필`}>
          <Avatar
            name={item.playerName}
            size="sm"
            level={item.playerLevel}
            imageUrl={item.playerAvatarUrl ?? undefined}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/p/${item.playerHandle}`}
              className="text-[14px] font-semibold text-text-1 truncate hover:text-accent transition-colors"
            >
              {item.playerName}
            </Link>
            <span className="shrink-0 text-[10px] text-text-3">&#x203A;</span>
            <span className="shrink-0 text-[10px]" style={{ color: posColor }}>
              {item.playerPosition}
            </span>
            <span className="shrink-0 text-[10px]" style={{ color: lvl.color }}>
              {lvl.icon}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-text-3">
            {item.teamName && <span>{item.teamName} · </span>}
            <span>{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <FeedBody item={item} />

      {/* Footer */}
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <button
          onClick={() => onKudos(item.id)}
          className={`flex items-center gap-1 text-[13px] transition-colors ${
            item.hasKudos ? "text-accent" : "text-text-3 hover:text-text-2"
          }`}
        >
          <span>&#x1F44F;</span>
          <span>{item.kudosCount > 0 ? item.kudosCount : "응원"}</span>
        </button>
        <button
          onClick={() => onComment?.(item.id)}
          className="flex items-center gap-1 text-[13px] text-text-3 hover:text-text-2 transition-colors"
        >
          <span>&#x1F4AC;</span>
          <span>{item.commentCount > 0 ? item.commentCount : "댓글"}</span>
        </button>
      </div>
    </div>
  );
});
