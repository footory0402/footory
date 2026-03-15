"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHotHighlights } from "@/hooks/useDiscover";

const PlayerRanking = dynamic(() => import("@/components/explore/PlayerRanking"), { ssr: false });
const RisingPlayers = dynamic(() => import("@/components/explore/RisingPlayers"), { ssr: false });
const TagGrid = dynamic(() => import("@/components/explore/TagGrid"), { ssr: false });
const ChallengeBanner = dynamic(() => import("@/components/challenge/ChallengeBanner"), { ssr: false });

type FilterTab = "all" | "player" | "clip" | "tag";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "player", label: "선수" },
  { key: "clip", label: "클립" },
  { key: "tag", label: "태그" },
];

export default function DiscoverPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = getFilterTab(searchParams.get("tab"));
  const [tab, setTab] = useState<FilterTab>(currentTab);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  const handleTabChange = (nextTab: FilterTab) => {
    startTransition(() => {
      setTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === "all") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="px-4 pt-4">
      {/* 검색바 — 탭하면 SearchOverlay 열림 */}
      <div className="relative mb-4">
        <div
          onClick={() => {/* TODO: SearchOverlay 열기 */}}
          className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 cursor-pointer"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-3">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-sm text-text-3">선수, 팀, 태그 검색...</span>
        </div>
      </div>

      {/* Underline tab bar */}
      <div className="flex border-b border-white/[0.06]">
        {FILTER_TABS.map((ft) => (
          <button
            key={ft.key}
            onClick={() => handleTabChange(ft.key)}
            className={`flex-1 min-h-[44px] pt-1 pb-2.5 text-sm font-medium relative ${
              tab === ft.key ? "text-accent" : "text-text-3"
            }`}
          >
            {ft.label}
            {tab === ft.key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content sections */}
      <div className="mt-6 space-y-8">
        {/* "전체" tab: overview */}
        {tab === "all" && (
          <>
            <ChallengeBanner />

            <Section title="이번 주 핫 클립" subtitle="가장 많이 본 하이라이트" seeMoreHref="/discover?tab=clip">
              <HotClips />
            </Section>

            <Section title="떠오르는 선수" subtitle="이번 주 조회수 급상승" seeMoreHref="/discover?tab=player">
              <RisingPlayers />
            </Section>

            <DeferredSection title="인기 선수 랭킹" subtitle="전체 팔로워 기준" seeMoreHref="/discover?tab=player">
              <PlayerRanking compact />
            </DeferredSection>

            <DeferredSection title="태그별 인기 클립" seeMoreHref="/discover?tab=tag">
              <TagGrid />
            </DeferredSection>
          </>
        )}

        {/* "선수" tab: full player ranking */}
        {tab === "player" && (
          <Section title="선수 랭킹">
            <PlayerRanking />
          </Section>
        )}

        {/* "클립" tab: 태그별 클립 탐색 */}
        {tab === "clip" && (
          <ClipExploreTab />
        )}

        {/* "태그" tab: full tag grid */}
        {tab === "tag" && (
          <Section title="태그별 인기 클립">
            <TagGrid />
          </Section>
        )}
      </div>

    </div>
  );
}

/* ── 이번 주 핫 클립 (2열 세로 카드 그리드) ── */
function HotClips() {
  const { items, loading } = useHotHighlights();
  const clips = items.slice(0, 4);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 aspect-video animate-pulse rounded-xl bg-card-alt" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card-alt" />
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.04] bg-card p-8 text-center">
        <p className="text-sm text-text-3">아직 등록된 클립이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {clips.map((clip, i) => (
        <div
          key={clip.id}
          className={`relative overflow-hidden rounded-xl bg-card ${i === 0 ? "col-span-2 aspect-video" : "aspect-[3/4]"}`}
        >
          {/* thumbnail */}
          {clip.metadata?.thumbnail_url && (
            <img src={clip.metadata.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {/* info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-xs font-bold text-white truncate">{clip.profiles?.name ?? "선수"}</p>
            {clip.metadata?.tags?.[0] && (
              <span className="inline-block mt-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                {clip.metadata.tags[0]}
              </span>
            )}
          </div>
          {/* views badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="text-[10px] font-stat text-white/70">
              {clip.metadata?.duration ? `${Math.floor(clip.metadata.duration)}s` : "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 클립 탭: 태그 필터 + 3열 그리드 ── */
function ClipExploreTab() {
  const { items, loading } = useHotHighlights();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 모든 태그 수집
  const allTags = Array.from(
    new Set(items.flatMap((clip) => clip.metadata?.tags ?? []))
  );

  const filtered = selectedTag
    ? items.filter((clip) => clip.metadata?.tags?.includes(selectedTag))
    : items;

  return (
    <div>
      {/* 태그 필터 칩 — 가로 스크롤 */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setSelectedTag(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedTag === null
              ? "bg-accent text-black"
              : "bg-card text-text-3 border border-white/[0.06]"
          }`}
        >
          전체
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTag === tag
                ? "bg-accent text-black"
                : "bg-card text-text-3 border border-white/[0.06]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3열 그리드 */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-card-alt" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.04] bg-card p-8 text-center">
          <p className="text-sm text-text-3">해당 태그의 클립이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((clip) => (
            <div key={clip.id} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
              {clip.metadata?.thumbnail_url && (
                <img src={clip.metadata.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <p className="text-[10px] font-bold text-white truncate">{clip.profiles?.name ?? "선수"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children, seeMoreHref }: { title: string; subtitle?: string; children: React.ReactNode; seeMoreHref?: string }) {
  return (
    <section>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-text-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-text-3 mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeMoreHref && (
          <Link href={seeMoreHref} className="text-xs text-accent font-semibold shrink-0">더보기 →</Link>
        )}
      </div>
      {children}
    </section>
  );
}

function DeferredSection({
  title,
  subtitle,
  children,
  seeMoreHref,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeMoreHref?: string;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [visible]);

  return (
    <section
      ref={containerRef}
      style={{ contentVisibility: "auto", containIntrinsicSize: "360px" }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-text-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-text-3 mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeMoreHref && (
          <Link href={seeMoreHref} className="text-xs text-text-3 shrink-0">
            더보기 →
          </Link>
        )}
      </div>
      {visible ? (
        children
      ) : (
        <div className="space-y-3 rounded-2xl border border-white/[0.04] bg-card p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-card-alt" />
          ))}
        </div>
      )}
    </section>
  );
}

function getFilterTab(value: string | null): FilterTab {
  return value === "player" || value === "clip" || value === "tag" ? value : "all";
}
