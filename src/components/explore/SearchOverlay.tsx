"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { POSITION_COLORS, SKILL_TAGS } from "@/lib/constants";
import type { Position } from "@/lib/constants";
import { useSearch } from "@/hooks/useDiscover";

const PlayerRanking = dynamic(() => import("./PlayerRanking"), { ssr: false });
const RisingPlayers = dynamic(() => import("./RisingPlayers"), { ssr: false });
const TeamRanking = dynamic(() => import("./TeamRanking"), { ssr: false });
const TagGrid = dynamic(() => import("./TagGrid"), { ssr: false });

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type SearchTab = "all" | "player" | "team" | "tag";

const TABS: { key: SearchTab; label: string; icon: string }[] = [
  { key: "all", label: "전체", icon: "" },
  { key: "player", label: "선수", icon: "👤" },
  { key: "team", label: "팀", icon: "👥" },
  { key: "tag", label: "태그", icon: "🏷" },
];

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useSearch(query);

  const close = useCallback(() => {
    setQuery("");
    setTab("all");
    onClose();
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // C10: 브라우저 뒤로가기로 오버레이 닫기
  useEffect(() => {
    if (!open) return;
    history.pushState({ searchOverlay: true }, "");
    const onPopState = () => close();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, close]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const matchedTags = hasQuery
    ? SKILL_TAGS.filter(
        (t) =>
          t.label.includes(query.trim()) ||
          t.dbName.includes(query.trim())
      )
    : [];

  const showPlayers = tab === "all" || tab === "player";
  const showTeams = tab === "all" || tab === "team";
  const showTags = tab === "all" || tab === "tag";

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button
          onClick={close}
          className="shrink-0 text-text-2 active:text-text-1 p-1"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="flex flex-1 h-10 items-center rounded-full bg-card-alt px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="선수, 팀, 태그 검색"
            className="ml-2 flex-1 bg-transparent text-[13px] text-text-1 placeholder:text-text-3 outline-none"
          />
          {hasQuery && (
            <button onClick={() => setQuery("")} className="text-text-3 text-[18px] leading-none">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-bg"
                : "bg-card-alt text-text-2"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {search.loading && (
          <div className="flex justify-center pt-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {!search.loading && hasQuery && search.players.length === 0 && search.teams.length === 0 && matchedTags.length === 0 && (
          <div className="flex flex-col items-center pt-16">
            <span className="text-[28px] mb-2">🔍</span>
            <p className="text-[13px] text-text-3">검색 결과가 없어요</p>
          </div>
        )}

        {/* C8: 검색어 없을 때 인기 콘텐츠 표시 */}
        {!hasQuery && (
          <div className="space-y-6 mt-2">
            <section>
              <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                🚀 떠오르는 선수
              </h3>
              <RisingPlayers />
            </section>
            <section>
              <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                🏆 인기 선수 랭킹
              </h3>
              <PlayerRanking compact />
            </section>
            <section>
              <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                🏟 팀 랭킹
              </h3>
              <TeamRanking compact />
            </section>
            <section>
              <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                🏷 인기 태그
              </h3>
              <TagGrid />
            </section>
          </div>
        )}

        {!search.loading && hasQuery && (
          <div className="space-y-4 mt-2">
            {/* Player results */}
            {showPlayers && search.players.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-2">
                  👤 선수
                </h3>
                <div className="space-y-1">
                  {search.players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-[10px] bg-card p-3 active:bg-card-alt transition-colors"
                    >
                      <Link href={`/p/${p.handle}`} onClick={close} className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={p.name} size="sm" imageUrl={p.avatar_url ?? undefined} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[15px] font-bold text-text-1 truncate">{p.name}</span>
                            {p.position && (
                              <span
                                className="rounded-md px-2 py-0.5 text-[10px] font-bold border border-accent/20"
                                style={{ color: POSITION_COLORS[p.position as Position], background: `${POSITION_COLORS[p.position as Position]}18` }}
                              >
                                {p.position}
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-text-3">@{p.handle}</span>
                        </div>
                      </Link>
                      <div className="shrink-0">
                        <FollowButton targetId={p.id} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Team results */}
            {showTeams && search.teams.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-2">
                  👥 팀
                </h3>
                <div className="space-y-1">
                  {search.teams.map((t) => (
                    <Link
                      key={t.id}
                      href={`/team/${t.id}`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-[10px] bg-card p-3 active:bg-card-alt transition-colors"
                    >
                      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-card-alt text-[14px] shrink-0">
                        {t.logo_url ? (
                          <Image
                            src={t.logo_url}
                            alt={t.name}
                            fill
                            sizes="36px"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          "⚽"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[15px] font-bold text-text-1 truncate block">{t.name}</span>
                        <span className="text-[12px] text-text-3">
                          {t.city && <><span className="text-text-2">{t.city}</span><span className="text-text-3/40"> · </span></>}<span className="text-text-1 font-medium">{t.member_count ?? 0}</span>명
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Tag results */}
            {showTags && matchedTags.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-2">
                  🏷 태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchedTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={close}
                      className="rounded-full bg-card px-3 py-1.5 text-[12px] text-text-1 active:bg-card-alt transition-colors"
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
