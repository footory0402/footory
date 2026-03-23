"use client";

import React, { useMemo } from "react";
import type { Profile, Stat, Season, PlayStyle } from "@/lib/types";

interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  action?: string;
}

interface ProfileCompletionGuideProps {
  profile: Profile;
  stats: Stat[];
  seasons: Season[];
  playStyle: PlayStyle | null;
  hasFeatured: boolean;
  onAction: (action: string) => void;
  userId: string;
}

function getStorageKey(userId: string, role: string) {
  return `footory_profile_complete_${userId}_${role}`;
}

interface ProfileCompletionGuideProps {
  profile: Profile;
  stats: Stat[];
  seasons: Season[];
  playStyle: PlayStyle | null;
  hasFeatured: boolean;
  onAction: (action: string) => void;
  userId: string;
  isLoading?: boolean;
}

export default function ProfileCompletionGuide({
  profile,
  stats,
  seasons,
  playStyle,
  hasFeatured,
  onAction,
  userId,
  isLoading,
}: ProfileCompletionGuideProps) {
  const storageKey = getStorageKey(userId, profile.role ?? "player");
  // null = 아직 hydration 전, true/false = localStorage 확인 완료
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const items: CompletionItem[] = useMemo(() => {
    if (profile.role === "scout") {
      return [
        { key: "avatar", label: "프로필 사진", done: !!profile.avatarUrl, action: "edit" },
        { key: "bio", label: "자기소개", done: !!profile.bio, action: "edit" },
        { key: "org", label: "소속 기관", done: !!profile.teamName, action: "edit" },
        { key: "city", label: "지역", done: !!profile.city, action: "edit" },
      ];
    }
    return [
      { key: "avatar", label: "프로필 사진", done: !!profile.avatarUrl, action: "edit" },
      { key: "position", label: "포지션", done: !!profile.position, action: "edit" },
      { key: "physical", label: "신체 정보", done: !!(profile.heightCm || profile.weightKg), action: "edit" },
      { key: "featured", label: "대표 영상", done: hasFeatured, action: "highlights" },
      { key: "stat", label: "스탯 기록", done: stats.length > 0, action: "records" },
      { key: "season", label: "시즌 추가", done: seasons.length > 0, action: "career" },
      { key: "playstyle", label: "플레이스타일", done: !!playStyle, action: "playstyle" },
    ];
  }, [profile, stats, seasons, playStyle, hasFeatured]);

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);
  const nextItem = items.find((i) => !i.done);

  React.useEffect(() => {
    if (pct === 100 && dismissed === false) {
      localStorage.setItem(storageKey, "1");
      setDismissed(true);
    }
  }, [pct, dismissed, storageKey]);

  // hydration 전이거나, 보조 데이터 로딩 중이거나, 이미 닫혔으면 숨김
  if (dismissed === null || dismissed || (isLoading && pct === 0)) return null;
  if (pct === 100) return null;

  return (
    <div style={{
      margin: "8px 14px 0",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
    }}>
      {/* 진행 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: 4, borderRadius: 2,
            background: "var(--color-accent)",
            width: `${pct}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{
          fontFamily: "var(--font-stat)",
          fontSize: 12, fontWeight: 700,
          color: "var(--color-accent)",
          minWidth: 34, textAlign: "right",
        }}>{pct}%</span>
      </div>
      {/* 다음 추천 액션 */}
      {nextItem && (
        <button
          onClick={() => nextItem.action && onAction(nextItem.action)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", padding: 0, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
            다음:
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", fontFamily: "var(--font-body)" }}>
            {nextItem.label} 추가하기 →
          </span>
        </button>
      )}
    </div>
  );
}
