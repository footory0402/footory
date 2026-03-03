"use client";

import Avatar from "@/components/ui/Avatar";
import { LEVELS, POSITION_COLORS } from "@/lib/constants";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import type { Position } from "@/lib/constants";

interface FeedCardProps {
  item: FeedItemEnriched;
  onKudos: (id: string) => void;
  onComment?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeedBody({ item }: { item: FeedItemEnriched }) {
  const meta = item.metadata as Record<string, any>;

  switch (item.type) {
    case "highlight":
      return (
        <div>
          <p className="text-[14px] text-text-1 mb-2">
            새 하이라이트를 등록했어요
          </p>
          {meta.thumbnail_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-card-alt">
              <img
                src={meta.thumbnail_url as string}
                alt="Highlight thumbnail"
                className="h-full w-full object-cover"
              />
              {meta.duration && (
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                  {Math.floor(meta.duration as number)}초
                </span>
              )}
            </div>
          )}
          {meta.tags && (meta.tags as string[]).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(meta.tags as string[]).map((tag) => (
                <span key={tag} className="rounded-full bg-card-alt px-2 py-0.5 text-[11px] text-text-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      );

    case "featured_change":
      return (
        <div>
          <p className="text-[14px] text-text-1">
            대표 클립을 변경했어요 ✨
          </p>
          {meta.thumbnail_url && (
            <div className="mt-2 aspect-video w-full overflow-hidden rounded-[10px] bg-card-alt">
              <img
                src={meta.thumbnail_url as string}
                alt="Featured clip"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      );

    case "medal":
      return (
        <div className="flex items-center gap-3 rounded-[10px] bg-card-alt p-3">
          <span className="text-[28px]">{(meta.icon as string) ?? "🏅"}</span>
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
            <span className="font-display text-[24px] font-bold text-accent">
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

export default function FeedCard({ item, onKudos, onComment }: FeedCardProps) {
  const lvl = LEVELS[Math.min(item.playerLevel, 5) - 1];
  const posColor = POSITION_COLORS[item.playerPosition as Position] ?? "#A1A1AA";

  return (
    <div className="rounded-[12px] bg-card p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          name={item.playerName}
          size="sm"
          level={item.playerLevel}
          imageUrl={item.playerAvatarUrl ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-text-1 truncate">
              {item.playerName}
            </span>
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
          <span>👏</span>
          <span>{item.kudosCount > 0 ? item.kudosCount : "응원"}</span>
        </button>
        <button
          onClick={() => onComment?.(item.id)}
          className="flex items-center gap-1 text-[13px] text-text-3 hover:text-text-2 transition-colors"
        >
          <span>💬</span>
          <span>{(item.metadata.comment_count as number) > 0 ? item.metadata.comment_count as number : "댓글"}</span>
        </button>
      </div>
    </div>
  );
}
