"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useLinkedChildren, type LinkedChild } from "@/hooks/useParent";
import type { ParentDashboardData } from "@/lib/home-types";
import ChildSelector from "./ChildSelector";
import WeeklyRecap from "./WeeklyRecap";
import LinkChildSheet from "./LinkChildSheet";
import ParentQuickUpload from "./ParentQuickUpload";

interface ChildDashboardProps {
  initialChildren?: LinkedChild[];
  hasInitialChildrenData?: boolean;
  initialSelectedChildId?: string | null;
  initialDashboard?: ParentDashboardData | null;
}

export default function ChildDashboard({
  initialChildren = [],
  hasInitialChildrenData = false,
  initialSelectedChildId = null,
  initialDashboard = null,
}: ChildDashboardProps) {
  const { children, loading: childrenLoading, linkChild, refetch } = useLinkedChildren({
    initialChildren,
    hasInitialData: hasInitialChildrenData,
  });
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialSelectedChildId ?? initialChildren[0]?.childId ?? null
  );
  const [dashboard, setDashboard] = useState<ParentDashboardData | null>(initialDashboard);
  const [loading, setLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<LinkedChild | null>(null);
  const shouldSkipInitialFetch = useRef(
    Boolean(initialDashboard && initialSelectedChildId)
  );

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].childId);
    }
  }, [children, selectedChildId]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (childId: string) => {
    setLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch(`/api/parent/dashboard?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setDashboard(null);
      setDashboardError(body.error ?? "대시보드를 불러오지 못했어요.");
    } catch {
      setDashboard(null);
      setDashboardError("대시보드를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    if (shouldSkipInitialFetch.current && selectedChildId === initialSelectedChildId) {
      shouldSkipInitialFetch.current = false;
      return;
    }
    void fetchDashboard(selectedChildId);
  }, [selectedChildId, fetchDashboard, initialSelectedChildId]);

  if (childrenLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // No linked children — onboarding
  if (children.length === 0) {
    return (
      <div className="px-4 pb-24 pt-6">
        <div className="flex flex-col items-center pt-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-4xl">
            👨‍👧
          </div>
          <p className="mt-4 text-[17px] font-bold text-text-1">자녀 계정을 연결해주세요</p>
          <p className="mt-2 text-center text-[13px] text-text-3">
            자녀의 핸들(@)을 입력하면<br />활동을 확인하고 영상을 올려줄 수 있어요
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowLink(true)}
              className="rounded-full bg-gradient-to-r from-accent to-accent-dim px-6 py-2.5 text-[14px] font-semibold text-bg"
            >
              자녀 검색
            </button>
          </div>
        </div>
        <LinkChildSheet open={showLink} onClose={() => setShowLink(false)} onLink={linkChild} />
      </div>
    );
  }

  const selectedChild = children.find((c) => c.childId === selectedChildId) ?? children[0];

  return (
    <div className="px-4 pb-24 pt-2">
      {/* Multi-child selector */}
      <ChildSelector
        childList={children}
        selectedId={selectedChild.childId}
        onSelect={setSelectedChildId}
      />

      {/* L2: '👋 {자녀이름} 보호자님' 인사 텍스트 */}
      <p className="mb-4 text-[16px] text-text-2">
        👋 <span className="font-bold text-text-1">{selectedChild.name}</span> 보호자님
      </p>

      {/* Weekly Recap (Monday only) */}
      <WeeklyRecap childId={selectedChild.childId} childName={selectedChild.name} />

      {/* MVP Rank Card */}
      {dashboard && dashboard.weeklyStats.mvpRank != null && dashboard.weeklyStats.mvpRank > 0 && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-[20px]">
              🏆
            </div>
            <div>
              <p className="text-[15px] font-bold text-accent">
                이번 주 MVP <span className="font-oswald text-[20px]">{dashboard.weeklyStats.mvpRank}</span>위
              </p>
              <p className="text-[12px] text-text-3">주간 MVP 랭킹</p>
            </div>
          </div>
        </div>
      )}

      {/* This week stats */}
      <div className="mb-4">
        <h3 className="mb-2 text-[13px] font-semibold text-text-3">
          {selectedChild.name}의 이번 주
        </h3>
        {loading ? (
          <div className="rounded-xl bg-card p-4 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 rounded bg-card-alt" />
                  <div className="h-4 w-12 rounded bg-card-alt" />
                </div>
              ))}
            </div>
          </div>
        ) : dashboard ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="space-y-2.5">
              <StatRow emoji="📹" label="새 영상" value={`${dashboard.weeklyStats.newClips}개`} isZero={dashboard.weeklyStats.newClips === 0} />
              <StatRow emoji="👏" label="받은 응원" value={`${dashboard.weeklyStats.kudosReceived}개`} isZero={dashboard.weeklyStats.kudosReceived === 0} />
              <StatRow emoji="👁" label="프로필 조회" value={`${dashboard.weeklyStats.profileViews}회`} isZero={dashboard.weeklyStats.profileViews === 0} />
              {dashboard.weeklyStats.mvpRank && (
                <StatRow emoji="🏆" label="MVP 순위" value={`${dashboard.weeklyStats.mvpRank}위`} />
              )}
              <StatRow emoji="📈" label="레벨" value={`Lv.${dashboard.weeklyStats.level}`} />
            </div>
            {/* Weekly Comparison */}
            {dashboard.prevWeeklyStats && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-text-3 mb-2">지난 주 대비</p>
                <div className="space-y-2">
                  <ComparisonBar
                    label="영상"
                    current={dashboard.weeklyStats.newClips}
                    previous={dashboard.prevWeeklyStats.newClips}
                  />
                  <ComparisonBar
                    label="응원"
                    current={dashboard.weeklyStats.kudosReceived}
                    previous={dashboard.prevWeeklyStats.kudosReceived}
                  />
                </div>
              </div>
            )}
          </div>
        ) : dashboardError ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[13px] font-medium text-text-1">
              이번 주 활동을 아직 불러오지 못했어요
            </p>
            <p className="mt-1 text-[12px] text-text-3">
              잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => selectedChildId && fetchDashboard(selectedChildId)}
              className="mt-3 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-2"
            >
              다시 불러오기
            </button>
          </div>
        ) : null}
      </div>

      {/* CTA buttons */}
      <div className="mb-4 flex gap-2">
        <Link
          href={`/p/${selectedChild.handle}`}
          className="flex-1 rounded-xl border border-border bg-card py-3 text-center text-[13px] font-medium text-text-2 active:bg-surface"
        >
          {selectedChild.name} 프로필 보기
        </Link>
        <button
          onClick={() => setUploadTarget(selectedChild)}
          className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-dim py-3 text-[13px] font-semibold text-bg"
        >
          영상 올려주기
        </button>
      </div>

      {/* Recent Activity */}
      {dashboard && dashboard.recentActivity.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px] font-semibold text-text-3">최근 활동</h3>
          <div className="rounded-xl border border-border bg-card">
            {dashboard.recentActivity.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  idx < dashboard.recentActivity.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] ${getActivityIconBg(item.type)}`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-text-1">{getActivityLabel(item.type, item.metadata)}</p>
                  <p className="mt-0.5 text-[10px] text-text-3">{formatTimeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team News */}
      {dashboard && dashboard.teamNews.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px] font-semibold text-text-3">🏟 소속 팀</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {dashboard.teamNews.map((news, idx) => (
              <Link
                key={news.teamId}
                href={`/team/${news.teamId}`}
                className={`flex items-center justify-between px-4 py-3.5 transition-colors active:bg-surface ${
                  idx < dashboard.teamNews.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[14px]">⚽</div>
                  <span className="text-sm font-medium text-text-1">{news.teamName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {news.newClips > 0 && (
                    <>
                      <span className="font-stat text-sm font-bold text-accent">{news.newClips}</span>
                      <span className="text-xs text-text-3">새 영상</span>
                    </>
                  )}
                  <svg className="ml-1 h-3.5 w-3.5 shrink-0 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add another child */}
      <button
        onClick={() => setShowLink(true)}
        className="w-full rounded-xl border border-dashed border-border py-2.5 text-[13px] text-text-3 hover:border-accent hover:text-accent"
      >
        + 다른 자녀 연동
      </button>

      <LinkChildSheet open={showLink} onClose={() => setShowLink(false)} onLink={linkChild} />

      {uploadTarget && (
        <ParentQuickUpload
          child={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onComplete={() => {
            refetch();
            if (selectedChildId) fetchDashboard(selectedChildId);
          }}
        />
      )}
    </div>
  );
}

function StatRow({ emoji, label, value, isZero }: { emoji: string; label: string; value: string; isZero?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-2">
        {emoji} {label}
      </span>
      <span className={`font-stat text-[14px] font-semibold ${isZero ? "text-text-3" : "text-text-1"}`}>
        {value}
        {isZero && <span className="ml-1 text-[10px] text-text-3">·</span>}
      </span>
    </div>
  );
}

function getActivityIconBg(type: string): string {
  const map: Record<string, string> = {
    highlight: "bg-accent/20",
    featured_change: "bg-accent/20",
    top_clip: "bg-accent/20",
    medal: "bg-yellow-500/20",
    stat: "bg-blue-500/20",
    level_up: "bg-blue-500/20",
  };
  return map[type] ?? "bg-card-alt";
}

function getActivityIcon(type: string): string {
  const map: Record<string, string> = {
    highlight: "📹",
    medal: "🏅",
    stat: "📏",
    season: "📋",
    featured_change: "⭐",
    top_clip: "🎯",
    level_up: "📈",
    team_join: "👥",
  };
  return map[type] ?? "📌";
}

function getActivityLabel(type: string, metadata: Record<string, unknown>): string {
  const uploadedByParent = metadata?.uploaded_by_parent;
  const tags = metadata?.tags as string[] | undefined;
  const tagStr = tags?.join(", ");

  switch (type) {
    case "highlight":
      return uploadedByParent
        ? `보호자님이 영상을 올려줬어요${tagStr ? ` (${tagStr})` : ""}`
        : `영상 업로드${tagStr ? ` — ${tagStr}` : ""}`;
    case "medal":
      return "메달 획득";
    case "stat":
      return "측정 기록 등록";
    case "featured_change":
      return "대표 클립 변경";
    case "top_clip":
      return "태그 대표 클립 지정";
    case "level_up":
      return `레벨 업! Lv.${metadata?.level ?? ""}`;
    case "team_join":
      return `${metadata?.team_name ?? "팀"} 가입`;
    default:
      return "활동";
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const d = new Date(dateStr);
  const absDate = `(${d.getMonth() + 1}/${d.getDate()})`;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전 ${absDate}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전 ${absDate}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전 ${absDate}`;

  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function ComparisonBar({ label, current, previous }: { label: string; current: number; previous: number }) {
  const max = Math.max(current, previous, 1);
  const currentPct = (current / max) * 100;
  const prevPct = (previous / max) * 100;
  const diff = current - previous;
  const diffLabel = diff > 0 ? `+${diff}` : diff === 0 ? "\u00B10" : `${diff}`;
  const diffColor = diff > 0 ? "text-green" : diff < 0 ? "text-red-400" : "text-text-3";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-text-2">{label}</span>
        <span className={`text-[12px] font-medium ${diffColor}`}>{diffLabel}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 rounded-full bg-card-alt overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${currentPct}%` }}
          />
        </div>
        <div className="flex-1 rounded-full bg-card-alt overflow-hidden">
          <div
            className="h-full rounded-full bg-text-3/40 transition-all duration-500"
            style={{ width: `${prevPct}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-accent">이번 주 {current}</span>
        <span className="text-[10px] text-text-3">지난 주 {previous}</span>
      </div>
    </div>
  );
}
