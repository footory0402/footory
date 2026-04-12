"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PlayerOnboarding from "@/components/onboarding/PlayerOnboarding";
import ParentOnboarding from "@/components/onboarding/ParentOnboarding";
import ScoutOnboarding from "@/components/onboarding/ScoutOnboarding";

const ROLES = [
  { value: "player", label: "선수", emoji: "⚽", desc: "직접 뛰는 선수예요" },
  { value: "parent", label: "부모/보호자", emoji: "👨‍👩‍👦", desc: "자녀의 성장을 기록해요" },
  { value: "scout", label: "코치/스카우터", emoji: "🔭", desc: "코치하거나 유망 선수를 발굴해요" },
] as const;

function OnboardingContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/";

  const [role, setRole] = useState<string>("");
  const [showRoleSelect, setShowRoleSelect] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const handleRoleSelect = (value: string) => {
    setRole(value);
    setTransitioning(true);
  };

  useEffect(() => {
    if (!transitioning) return;
    const timer = setTimeout(() => {
      setShowRoleSelect(false);
      setTransitioning(false);
    }, 380);
    return () => clearTimeout(timer);
  }, [transitioning]);

  const handleBack = () => {
    setShowRoleSelect(true);
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      {/* Role Select */}
      {showRoleSelect && (
        <div className="animate-fade-up flex flex-1 flex-col">
          {/* 브랜드 워드마크 */}
          <div className="mb-8 flex items-center gap-2">
            <span className="font-['Rajdhani'] text-[22px] font-bold tracking-wider text-accent">
              FOOTORY
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-1">반가워요!</h1>
          <p className="mt-2 text-sm text-text-2">어떤 역할로 시작하시나요?</p>

          <div className="mt-6 flex flex-col gap-3">
            {ROLES.map((r) => {
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-label={r.label}
                  onClick={() => handleRoleSelect(r.value)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-accent bg-[var(--accent-bg)] scale-[1.01]"
                      : "border-border bg-card active:scale-[0.99]"
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-text-1">{r.label}</p>
                    <p className="text-xs text-text-3">{r.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-text-3">
            선택하면 바로 시작돼요
          </p>
        </div>
      )}

      {/* Role-specific onboarding */}
      {!showRoleSelect && role === "player" && (
        <PlayerOnboarding onBack={handleBack} redirectTo={redirectTo} />
      )}
      {!showRoleSelect && role === "parent" && (
        <ParentOnboarding onBack={handleBack} redirectTo={redirectTo} />
      )}
      {!showRoleSelect && role === "scout" && (
        <ScoutOnboarding onBack={handleBack} redirectTo={redirectTo} />
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
