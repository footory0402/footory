"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLinkedChildren, type LinkedChild } from "@/hooks/useParent";
import ChildSelector from "./ChildSelector";
import WeeklyRecap from "./WeeklyRecap";
import LinkChildSheet from "./LinkChildSheet";
import ParentQuickUpload from "./ParentQuickUpload";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/Badge";

interface DashboardData {
  parentName: string;
  child: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    position: string | null;
    level: number;
    xp: number;
    followers_count: number;
    views_count: number;
  };
  weeklyStats: {
    newClips: number;
    kudosReceived: number;
    profileViews: number;
    mvpRank: number | null;
    level: number;
  };
  recentActivity: {
    id: string;
    type: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }[];
  teamNews: {
    teamId: string;
    teamName: string;
    newClips: number;
  }[];
}

export default function ChildDashboard() {
  const { children, loading: childrenLoading, linkChild, refetch } = useLinkedChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<LinkedChild | null>(null);

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].childId);
    }
  }, [children, selectedChildId]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (childId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/dashboard?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchDashboard(selectedChildId);
  }, [selectedChildId, fetchDashboard]);

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
        children={children}
        selectedId={selectedChild.childId}
        onSelect={setSelectedChildId}
      />

      {/* Greeting */}
      <p className="mb-4 text-[16px] text-text-2">
        👋 <span className="font-semibold text-text-1">{dashboard?.parentName ?? ""}</span>님
      </p>

      {/* Weekly Recap (Monday only) */}
      <WeeklyRecap childId={selectedChild.childId} childName={selectedChild.name} />

      {/* This week stats */}
      <div className="mb-4">
        <h3 className="mb-2 text-[13px] font-semibold text-text-3">
          {selectedChild.name}의 이번 주
        </h3>
        {loading ? (
          <div className="rounded-[14px] bg-card p-4 animate-pulse">
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
          <div className="rounded-[14px] border border-border bg-card p-4">
            <div className="space-y-2.5">
              <StatRow emoji="📹" label="새 영상" value={`${dashboard.weeklyStats.newClips}개`} />
              <StatRow emoji="👏" label="받은 응원" value={`${dashboard.weeklyStats.kudosReceived}개`} />
              <StatRow emoji="👁" label="프로필 조회" value={`${dashboard.weeklyStats.profileViews}회`} />
              {dashboard.weeklyStats.mvpRank && (
                <StatRow emoji="🏆" label="MVP 순위" value={`${dashboard.weeklyStats.mvpRank}위`} />
              )}
              <StatRow emoji="📈" label="레벨" value={`Lv.${dashboard.weeklyStats.level}`} />
            </div>
          </div>
        ) : null}
      </div>

      {/* CTA buttons */}
      <div className="mb-4 flex gap-2">
        <Link
          href={`/p/${selectedChild.handle}`}
          className="flex-1 rounded-[10px] border border-border bg-card py-3 text-center text-[13px] font-medium text-text-2 active:bg-surface"
        >
          {selectedChild.name} 프로필 보기
        </Link>
        <button
          onClick={() => setUploadTarget(selectedChild)}
          className="flex-1 rounded-[10px] bg-gradient-to-r from-accent to-accent-dim py-3 text-[13px] font-semibold text-bg"
        >
          영상 올려주기
        </button>
      </div>

      {/* Recent Activity */}
      {dashboard && dashboard.recentActivity.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px] font-semibold text-text-3">최근 활동</h3>
          <div className="rounded-[14px] border border-border bg-card">
            {dashboard.recentActivity.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  idx < dashboard.recentActivity.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="mt-0.5 text-[14px]">{getActivityIcon(item.type)}</span>
                <div className="flex-1">
                  <p className="text-[13px] text-text-1">{getActivityLabel(item.type, item.metadata)}</p>
                  <p className="mt-0.5 text-[11px] text-text-3">{formatTimeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team News */}
      {dashboard && dashboard.teamNews.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px] font-semibold text-text-3">팀 소식</h3>
          <div className="rounded-[14px] border border-border bg-card">
            {dashboard.teamNews.map((news) => (
              <div key={news.teamId} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-text-1">{news.teamName}</span>
                <span className="text-[12px] text-text-3">새 영상 {news.newClips}개</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add another child */}
      <button
        onClick={() => setShowLink(true)}
        className="w-full rounded-[10px] border border-dashed border-border py-2.5 text-[13px] text-text-3 hover:border-accent hover:text-accent"
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

function StatRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-2">
        {emoji} {label}
      </span>
      <span className="font-oswald text-[14px] font-semibold text-text-1">{value}</span>
    </div>
  );
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

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
