"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUploadStore } from "@/stores/upload-store";
import PushPermissionPrompt, { shouldShowPushPrompt } from "@/components/notifications/PushPermissionPrompt";

interface ConfettiParticle {
  left: string;
  animationDelay: string;
  animationDuration: string;
}

function createConfettiParticles(): ConfettiParticle[] {
  return Array.from({ length: 20 }, () => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.8}s`,
    animationDuration: `${1.5 + Math.random() * 1.5}s`,
  }));
}

export default function UploadComplete() {
  const { tags, context, childName, reset } = useUploadStore();
  const isParent = context === "parent";
  const isChallenge = context === "challenge";
  const [showPush, setShowPush] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [particles] = useState<ConfettiParticle[]>(createConfettiParticles);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setConfettiVisible(true));

    // Push prompt after delay
    if (shouldShowPushPrompt()) {
      const timer = setTimeout(() => setShowPush(true), 800);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }

    return () => cancelAnimationFrame(frame);
  }, []);

  const tagLabels = tags.join(" · ");

  return (
    <>
      {showPush && <PushPermissionPrompt onClose={() => setShowPush(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95">
        {/* Gold confetti particles */}
        {confettiVisible && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {particles.map((particle, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={particle}
              />
            ))}
          </div>
        )}

        <div className="mx-6 flex w-full max-w-[360px] flex-col items-center gap-5 animate-scale-up">
          {/* Success icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-bg)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-text-1">업로드 완료!</h2>

          {/* Tag summary */}
          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/15 px-3 py-1 text-[12px] font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Exposure info card ── */}
          <div className="w-full overflow-hidden rounded-xl border border-white/[0.06] bg-card">
            <p className="px-4 pt-3 pb-2 text-[12px] font-medium text-text-3">
              {isParent ? `${childName ?? "자녀"} 프로필에 반영돼요` : "이 영상이 보이는 곳"}
            </p>

            <ExposureRow
              icon="👤"
              title={isParent ? "자녀 프로필 하이라이트" : "내 프로필 하이라이트"}
              subtitle={tagLabels ? `${tagLabels} 태그에 추가` : "하이라이트에 추가"}
            />
            <div className="mx-4 border-t border-white/[0.04]" />
            <ExposureRow
              icon="📰"
              title="홈 피드 게시"
              subtitle="팔로워에게 자동 노출"
            />
            <div className="mx-4 border-t border-white/[0.04]" />
            <ExposureRow
              icon="🏆"
              title="MVP 투표 후보 등록"
              subtitle="이번 주 순위에 반영"
            />
            {isChallenge && (
              <>
                <div className="mx-4 border-t border-white/[0.04]" />
                <ExposureRow
                  icon="🎯"
                  title="챌린지 순위 반영"
                  subtitle="이번 주 챌린지 랭킹에 등록"
                />
              </>
            )}
          </div>

          {/* Parent note */}
          {isParent && (
            <p className="text-[12px] text-text-3">
              대표 영상 설정은 선수가 직접 해요
            </p>
          )}

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-2.5">
            {!isParent && (
              <Link
                href="/profile?tab=highlights&new=true"
                onClick={() => reset()}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent py-3.5 text-sm font-bold text-bg transition-opacity active:opacity-80"
              >
                대표 영상으로 설정
              </Link>
            )}

            {isChallenge && (
              <Link
                href="/mvp"
                onClick={() => reset()}
                className="flex w-full items-center justify-center rounded-xl border border-accent/30 py-3 text-sm font-medium text-accent transition-opacity active:opacity-80"
              >
                챌린지 순위 확인하기
              </Link>
            )}

            <Link
              href={isParent ? `/p/${useUploadStore.getState().childHandle ?? ""}` : "/profile?tab=highlights&new=true"}
              onClick={() => reset()}
              className="flex w-full items-center justify-center rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-text-2 transition-opacity active:opacity-80"
            >
              {isParent ? "자녀 프로필 보기" : "내 프로필에서 확인"}
            </Link>

            <button
              type="button"
              onClick={() => reset()}
              className="py-2 text-[13px] font-medium text-text-3 transition-colors active:text-text-2"
            >
              하나 더 올리기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ExposureRow({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[13px] font-medium text-text-1">{title}</p>
        <p className="text-[11px] text-text-3">{subtitle}</p>
      </div>
    </div>
  );
}
