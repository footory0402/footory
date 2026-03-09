"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUploadStore } from "@/stores/upload-store";
import PushPermissionPrompt, { shouldShowPushPrompt } from "@/components/notifications/PushPermissionPrompt";

export default function UploadComplete() {
  const { tags, context, reset } = useUploadStore();
  const isParent = context === "parent";
  const isChallenge = context === "challenge";
  const [showPush, setShowPush] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    // Trigger confetti
    requestAnimationFrame(() => setConfettiVisible(true));

    // Push prompt after delay
    if (shouldShowPushPrompt()) {
      const timer = setTimeout(() => setShowPush(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      {showPush && <PushPermissionPrompt onClose={() => setShowPush(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95">
        {/* Gold confetti particles */}
        {confettiVisible && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.8}s`,
                  animationDuration: `${1.5 + Math.random() * 1.5}s`,
                }}
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

          <div className="text-center">
            <h2 className="text-lg font-bold text-text-1">업로드 완료!</h2>
            <p className="mt-1 text-sm text-text-2">
              영상이 프로필에 추가되었습니다.
            </p>
          </div>

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

          {/* MVP notice */}
          <div className="w-full rounded-xl bg-accent/8 px-4 py-3 text-center">
            <p className="text-[13px] text-accent">
              MVP 투표 후보에 자동 등록됐어요!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-2.5">
            {isParent ? (
              <p className="mb-1 text-center text-[12px] text-text-3">
                대표 영상 설정은 선수가 직접 합니다
              </p>
            ) : (
              <Link
                href="/profile"
                onClick={() => reset()}
                className="flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-sm font-bold text-bg transition-opacity active:opacity-80"
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
              href="/profile"
              onClick={() => reset()}
              className="flex w-full items-center justify-center rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-text-2 transition-opacity active:opacity-80"
            >
              내 프로필 보기
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
