"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PlayerRanking = dynamic(() => import("@/components/explore/PlayerRanking"), { ssr: false });
const RisingPlayers = dynamic(() => import("@/components/explore/RisingPlayers"), { ssr: false });
const TeamRanking = dynamic(() => import("@/components/explore/TeamRanking"), { ssr: false });
const TagGrid = dynamic(() => import("@/components/explore/TagGrid"), { ssr: false });
type FilterTab = "all" | "player" | "team" | "tag";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "player", label: "선수" },
  { key: "team", label: "팀" },
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
      {/* Underline tab bar — 검색은 AppHeader의 검색바 활용 */}
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
        {/* "전체" tab: shows all sections in overview */}
        {tab === "all" && (
          <>
            <Section title="떠오르는 선수" subtitle="이번 주 인기 상승" seeMoreHref="/discover?tab=player">
              <RisingPlayers />
            </Section>

            <DeferredSection title="인기 선수 랭킹" subtitle="전체 팔로워 기준" seeMoreHref="/discover?tab=player">
              <PlayerRanking compact />
            </DeferredSection>

            <DeferredSection title="팀 랭킹" seeMoreHref="/discover?tab=team">
              <TeamRanking compact />
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

        {/* "팀" tab: full team ranking */}
        {tab === "team" && (
          <Section title="팀 랭킹">
            <TeamRanking />
          </Section>
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
          <Link href={seeMoreHref} className="text-xs text-text-3 shrink-0">더보기 →</Link>
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
  return value === "player" || value === "team" || value === "tag" ? value : "all";
}
