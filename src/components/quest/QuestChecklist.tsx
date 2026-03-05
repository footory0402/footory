"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ONBOARDING_QUESTS, getWeeklyQuests } from "@/lib/quests";

interface QuestProgress {
  quest_key: string;
  completed_at: string | null;
}

interface QuestItemProps {
  label: string;
  xp: number;
  completed: boolean;
}

function QuestItem({ label, xp, completed }: QuestItemProps) {
  return (
    <div className={`flex items-center gap-3 py-2 ${completed ? "opacity-50" : ""}`}>
      {/* Checkbox */}
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border"
        style={{
          borderColor: completed ? "var(--color-accent)" : "var(--color-border)",
          background: completed ? "rgba(212,168,83,0.15)" : "transparent",
        }}
      >
        {completed && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        className={`flex-1 text-[13px] font-medium ${completed ? "line-through text-text-3" : "text-text-1"}`}
      >
        {label}
      </span>

      {/* XP */}
      <span
        className="font-stat text-[11px] font-bold"
        style={{ color: completed ? "var(--color-text-3)" : "var(--color-accent)" }}
      >
        +{xp} XP
      </span>
    </div>
  );
}

export default function QuestChecklist({ profileId }: { profileId: string }) {
  const [progress, setProgress] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<"onboarding" | "weekly">("onboarding");

  const weeklyQuests = getWeeklyQuests();

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const allKeys = [
        ...ONBOARDING_QUESTS.map((q) => q.key),
        ...weeklyQuests.map((q) => q.key),
        "onboarding_complete",
        `weekly_bonus_${weeklyQuests[0]?.key.split("_").at(-1) ?? ""}`,
      ];

      const { data } = await supabase
        .from("quest_progress")
        .select("quest_key, completed_at")
        .eq("profile_id", profileId)
        .in("quest_key", allKeys);

      setProgress(data ?? []);
      setLoading(false);
    }

    load();
  }, [profileId]);

  const completedKeys = new Set(
    progress.filter((p) => p.completed_at !== null).map((p) => p.quest_key)
  );

  const onboardingCompleted = ONBOARDING_QUESTS.filter((q) => completedKeys.has(q.key)).length;
  const onboardingTotal = ONBOARDING_QUESTS.length;
  const onboardingAllDone = onboardingCompleted === onboardingTotal;

  const weeklyCompleted = weeklyQuests.filter((q) => completedKeys.has(q.key)).length;
  const weeklyTotal = weeklyQuests.length;
  const weeklyAllDone = weeklyCompleted === weeklyTotal;

  // 전체 완료 축하
  useEffect(() => {
    if (!loading && (onboardingAllDone || weeklyAllDone) && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [loading, onboardingAllDone, weeklyAllDone]);

  if (loading) return null;

  // 온보딩 완료 + 주간도 완료면 카드 숨김
  if (onboardingAllDone && weeklyAllDone) return null;

  return (
    <div
      className="mb-4 overflow-hidden rounded-[12px]"
      style={{ border: "1px solid rgba(212,168,83,0.15)", background: "var(--color-card)" }}
    >
      {/* Gold accent */}
      <div className="h-[2px]" style={{ background: "var(--accent-gradient)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
            퀘스트
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-text-1">
            {activeTab === "onboarding" ? (
              <>초보자 퀘스트 <span className="font-stat text-text-3">{onboardingCompleted}/{onboardingTotal}</span></>
            ) : (
              <>주간 퀘스트 <span className="font-stat text-text-3">{weeklyCompleted}/{weeklyTotal}</span></>
            )}
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 rounded-[8px] bg-card-alt p-0.5">
          {(["onboarding", "weekly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: activeTab === tab ? "var(--color-accent)" : "transparent",
                color: activeTab === tab ? "#0C0C0E" : "var(--color-text-3)",
              }}
            >
              {tab === "onboarding" ? "초보자" : "주간"}
            </button>
          ))}
        </div>
      </div>

      {/* Quest list */}
      <div className="px-4 pb-3 divide-y divide-border/40">
        {activeTab === "onboarding"
          ? ONBOARDING_QUESTS.map((q) => (
              <QuestItem
                key={q.key}
                label={q.label}
                xp={q.xp}
                completed={completedKeys.has(q.key)}
              />
            ))
          : weeklyQuests.map((q) => (
              <QuestItem
                key={q.key}
                label={q.label}
                xp={q.xp}
                completed={completedKeys.has(q.key)}
              />
            ))}

        {/* 주간 보너스 안내 */}
        {activeTab === "weekly" && !weeklyAllDone && (
          <div className="pt-2 text-[11px] text-text-3">
            전부 완료 시 보너스 <span className="font-stat font-bold" style={{ color: "var(--color-accent)" }}>+50 XP</span>
          </div>
        )}
      </div>

      {/* 축하 오버레이 */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/70">
          <div className="text-center">
            <div className="text-[40px]">🎉</div>
            <div className="mt-1 text-[14px] font-bold text-text-1">퀘스트 완료!</div>
            {onboardingAllDone && (
              <div className="mt-0.5 text-[12px]" style={{ color: "var(--color-accent)" }}>
                🎒 신입생 뱃지 획득
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
