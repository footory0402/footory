"use client";

import { useState } from "react";
import PlayerOnboarding from "@/components/onboarding/PlayerOnboarding";
import ParentOnboarding from "@/components/onboarding/ParentOnboarding";
import ScoutOnboarding from "@/components/onboarding/ScoutOnboarding";

const ROLES = [
  { value: "player", label: "선수", emoji: "⚽", desc: "직접 뛰는 선수예요" },
  { value: "parent", label: "부모/보호자", emoji: "👨‍👩‍👦", desc: "자녀의 성장을 기록해요" },
  { value: "scout", label: "코치/스카우터", emoji: "🔭", desc: "코치하거나 유망 선수를 발굴해요" },
] as const;

export default function OnboardingPage() {
  const [role, setRole] = useState<string>("");
  const [showRoleSelect, setShowRoleSelect] = useState(true);

  const handleRoleConfirm = () => {
    if (role) setShowRoleSelect(false);
  };

  const handleBack = () => {
    setShowRoleSelect(true);
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col px-6 py-10">
      {/* Role Select */}
      {showRoleSelect && (
        <div className="animate-fade-up flex-1">
          <h1 className="text-2xl font-bold text-text-1">반가워요!</h1>
          <p className="mt-2 text-sm text-text-2">어떤 역할로 사용하시나요?</p>

          <div className="mt-8 flex flex-col gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-label={r.label}
                onClick={() => setRole(r.value)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  role === r.value
                    ? "border-accent bg-[var(--accent-bg)]"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <p className="font-semibold text-text-1">{r.label}</p>
                  <p className="text-xs text-text-3">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            disabled={!role}
            onClick={handleRoleConfirm}
            className="mt-8 w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {/* Role-specific onboarding */}
      {!showRoleSelect && role === "player" && (
        <PlayerOnboarding onBack={handleBack} />
      )}
      {!showRoleSelect && role === "parent" && (
        <ParentOnboarding onBack={handleBack} />
      )}
      {!showRoleSelect && role === "scout" && (
        <ScoutOnboarding onBack={handleBack} />
      )}
    </div>
  );
}
