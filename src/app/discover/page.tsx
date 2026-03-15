"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PlayerRanking = dynamic(() => import("@/components/explore/PlayerRanking"), { ssr: false });
const TeamRanking = dynamic(() => import("@/components/explore/TeamRanking"), { ssr: false });
const TagGrid = dynamic(() => import("@/components/explore/TagGrid"), { ssr: false });

type FilterTab = "player" | "team" | "tag";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
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
      if (nextTab === "player") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* 검색바 — 탭하면 SearchOverlay 열림 */}
      <div className="relative mb-4">
        <div
          onClick={() => {/* TODO: SearchOverlay 열기 */}}
          className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 cursor-pointer transition-colors active:bg-card-alt"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-3 shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-sm text-text-3">선수, 팀, 태그 검색...</span>
        </div>
      </div>

      {/* 3탭: 선수 | 팀 | 태그 */}
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

      {/* Content */}
      <div className="mt-5">
        {/* 선수 탭: 필터 + 랭킹 */}
        {tab === "player" && (
          <PlayerRanking />
        )}

        {/* 팀 탭: 팀 검색/목록 */}
        {tab === "team" && (
          <TeamRanking />
        )}

        {/* 태그 탭: 스킬 태그 → 선수 발견 */}
        {tab === "tag" && (
          <div className="space-y-3">
            <p className="text-xs text-text-3">태그를 선택하면 해당 스킬의 선수를 찾을 수 있어요</p>
            <TagGrid />
          </div>
        )}
      </div>
    </div>
  );
}

function getFilterTab(value: string | null): FilterTab {
  return value === "team" || value === "tag" ? value : "player";
}
