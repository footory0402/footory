"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ONBOARDING_QUESTS, getWeeklyQuests } from "@/lib/quests";

const ACTION_ROUTES: Record<string, string> = {
  profile_photo: "/profile",
  upload: "/upload",
  follow: "/discover",
  kudos: "/",
  vote: "/mvp",
};

interface QuestProgress {
  quest_key: string;
  completed_at: string | null;
}

const ACTION_ICONS: Record<string, string> = {
  profile_photo: "📸",
  upload: "🎬",
  follow: "👥",
  kudos: "👏",
  vote: "🗳️",
};

function QuestItem({
  label,
  xp,
  completed,
  action,
  onClick,
}: {
  label: string;
  xp: number;
  completed: boolean;
  action: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${!completed && onClick ? "cursor-pointer rounded-lg transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]" : ""}`}
      onClick={!completed ? onClick : undefined}
    >
      {/* Check circle / icon */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{
          background: completed
            ? "var(--color-accent)"
            : "rgba(255,255,255,0.06)",
        }}
      >
        {completed ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A0A0C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="text-[12px]">{ACTION_ICONS[action] || "🎯"}</span>
        )}
      </div>

      {/* Label */}
      <span
        className={`flex-1 text-[13px] font-medium ${
          completed ? "text-text-3 line-through" : "text-text-1"
        }`}
      >
        {label}
      </span>

      {/* XP + 화살표 */}
      {!completed && (
        <div className="flex items-center gap-1">
          <span className="font-stat text-[11px] font-bold text-accent">
            +{xp}
          </span>
          {onClick && (
            <svg className="h-3.5 w-3.5 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestChecklist() {
  const router = useRouter();
  const [progress, setProgress] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const weeklyQuests = useMemo(() => getWeeklyQuests(), []);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setProfileId(user.id);

      const allKeys = [
        ...ONBOARDING_QUESTS.map((q) => q.key),
        ...weeklyQuests.map((q) => q.key),
        "onboarding_complete",
        `weekly_bonus_${weeklyQuests[0]?.key.split("_").at(-1) ?? ""}`,
      ];

      const { data } = await supabase
        .from("quest_progress")
        .select("quest_key, completed_at")
        .eq("profile_id", user.id)
        .in("quest_key", allKeys);

      setProgress(data ?? []);
      setLoading(false);
    }

    load();
  }, [weeklyQuests]);

  const completedKeys = new Set(
    progress.filter((p) => p.completed_at !== null).map((p) => p.quest_key)
  );

  const onboardingDone = ONBOARDING_QUESTS.filter((q) =>
    completedKeys.has(q.key)
  ).length;
  const onboardingTotal = ONBOARDING_QUESTS.length;
  const onboardingAllDone = onboardingDone === onboardingTotal;

  const weeklyDone = weeklyQuests.filter((q) =>
    completedKeys.has(q.key)
  ).length;
  const weeklyTotal = weeklyQuests.length;
  const weeklyAllDone = weeklyDone === weeklyTotal;

  // 전부 완료 or 로딩 중 or 닫기 누름 → 안 보임
  if (loading || dismissed || (onboardingAllDone && weeklyAllDone) || !profileId)
    return null;

  // 온보딩 미완이면 온보딩, 아니면 주간
  const showOnboarding = !onboardingAllDone;
  const quests = showOnboarding ? ONBOARDING_QUESTS : weeklyQuests;
  const done = showOnboarding ? onboardingDone : weeklyDone;
  const total = showOnboarding ? onboardingTotal : weeklyTotal;
  const progressPct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div
      className="mb-4 overflow-hidden rounded-[14px]"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(212,168,83,0.10)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🎯</span>
          <span className="text-[14px] font-bold text-text-1">
            {showOnboarding ? "시작하기" : "이번 주 퀘스트"}
          </span>
          <span className="font-stat text-[12px] font-bold text-text-3">
            {done}/{total}
          </span>
        </div>
        {/* XP 설명 툴팁 */}
        <span className="text-[10px] text-text-3">XP 쌓으면 레벨업!</span>
        {/* 닫기 (주간 퀘스트만 — 온보딩은 못 닫음) */}
        {!showOnboarding && (
          <button
            onClick={() => setDismissed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-white/5 hover:text-text-2"
            aria-label="닫기"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mx-4 mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: "var(--accent-gradient, #D4A853)",
          }}
        />
      </div>

      {/* Quest items */}
      <div className="px-4 pt-1 pb-3">
        {quests.map((q) => (
          <QuestItem
            key={q.key}
            label={q.label}
            xp={q.xp}
            completed={completedKeys.has(q.key)}
            action={q.action}
            onClick={ACTION_ROUTES[q.action] ? () => router.push(ACTION_ROUTES[q.action]) : undefined}
          />
        ))}

        {/* 주간 보너스 */}
        {!showOnboarding && !weeklyAllDone && (
          <div className="mt-1 text-center text-[11px] text-text-3">
            전부 완료 시{" "}
            <span className="font-stat font-bold text-accent">+50 XP</span>
          </div>
        )}
      </div>
    </div>
  );
}
