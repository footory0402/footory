"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChallengeRanking from "./ChallengeRanking";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  skill_tag: string | null;
  week_start: string;
  is_active: boolean;
}

function getDaysLeft(weekStart: string): number {
  const monday = new Date(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const diff = sunday.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ChallengeBanner() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title, description, skill_tag, week_start, is_active")
        .eq("is_active", true)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return;
      setChallenge(data as Challenge);

      // 참여자 수: skill_tag가 있는 clip_tags 개수 (병렬 아닌 단독이지만 challenge 존재 시에만)
      if (data.skill_tag) {
        supabase
          .from("clip_tags")
          .select("id", { count: "exact", head: true })
          .eq("tag_name", data.skill_tag)
          .then(({ count }) => setParticipantCount(count ?? 0));
      }
    }

    // Defer challenge banner fetch to not block initial feed render
    const timer = setTimeout(load, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!challenge) return null;

  const daysLeft = getDaysLeft(challenge.week_start);

  function openRanking() {
    setRankingOpen(true);
  }

  function handleBannerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRanking();
    }
  }

  function goToParticipate() {
    if (!challenge) return;

    const params = new URLSearchParams();
    if (challenge.skill_tag) params.set("challenge_tag", challenge.skill_tag);
    params.set("challenge_title", challenge.title);
    router.push(`/upload?${params.toString()}`);
  }

  function handleParticipate(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    goToParticipate();
  }

  return (
    <>
      <div
        className="mb-4 w-full text-left"
        role="button"
        tabIndex={0}
        onClick={openRanking}
        onKeyDown={handleBannerKeyDown}
      >
        <div
          className="overflow-hidden rounded-[12px] transition-opacity active:opacity-80"
          style={{
            background: "var(--color-card)",
            border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
          }}
        >
          {/* Gold accent line */}
          <div className="h-[2px]" style={{ background: "var(--accent-gradient)" }} />

          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* Icon */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px]"
              style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
            >
              🎯
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div
                className="mb-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--color-accent)" }}
              >
                이번 주 챌린지
              </div>
              <div className="truncate text-[14px] font-bold text-text-1">
                {challenge.title}
              </div>
              <div className="mt-0.5 text-xs text-text-3">
                참여 <span className="font-stat font-bold text-accent">{participantCount}</span>명
                {daysLeft > 0 ? (
                  <> · <span className="font-stat font-bold text-text-2">{daysLeft}</span>일 남음</>
                ) : (
                  <> · 오늘 마감</>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleParticipate}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-opacity active:opacity-75"
              style={{ background: "var(--accent-gradient)", color: "var(--color-bg)" }}
            >
              참여하기 →
            </button>
          </div>
        </div>
      </div>

      <ChallengeRanking
        challenge={challenge}
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        onParticipate={goToParticipate}
      />
    </>
  );
}
