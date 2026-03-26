"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EffectsToggleProps {
  effects: {
    color: boolean;
    cinematic: boolean;
    eafc: boolean;
    intro: boolean;
  };
  onChange: (effects: Partial<EffectsToggleProps["effects"]>) => void;
}

const EFFECT_ITEMS = [
  { key: "color" as const, label: "색보정", description: "밝기와 채도를 자동으로 보정해요" },
  { key: "cinematic" as const, label: "영화 느낌 바", description: "위아래에 검은 바가 생겨 영화처럼 보여요" },
  { key: "eafc" as const, label: "선수 카드 효과", description: "하단에 등번호·이름·포지션이 표시돼요" },
  { key: "intro" as const, label: "인트로 카드", description: "영상 시작 전 2초간 선수 소개가 나와요" },
];

export default function EffectsToggle({ effects, onChange }: EffectsToggleProps) {
  const [hasCard, setHasCard] = useState<boolean | null>(null);

  // Check if player card exists when intro toggle is relevant
  useEffect(() => {
    fetch("/api/player-card")
      .then((r) => {
        if (!r.ok) { setHasCard(false); return; }
        return r.json();
      })
      .then((res) => {
        setHasCard(!!res?.card);
      })
      .catch(() => setHasCard(false));
  }, []);

  return (
    <div className="flex flex-col gap-1">
      {EFFECT_ITEMS.map((item) => {
        const isOn = effects[item.key];
        const isIntro = item.key === "intro";
        const showCardWarning = isIntro && isOn && hasCard === false;

        return (
          <div key={item.key}>
            <button
              type="button"
              onClick={() => onChange({ [item.key]: !isOn })}
              className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3.5"
            >
              <div className="flex flex-col items-start">
                <span className="text-[14px] font-medium text-text-1">
                  {item.label}
                  {isIntro && hasCard && (
                    <span className="ml-1.5 text-[10px] text-accent">카드 저장됨 ✓</span>
                  )}
                </span>
                <span className="text-[11px] text-text-3">
                  {item.description}
                </span>
              </div>

              {/* Toggle switch */}
              <div
                role="switch"
                aria-checked={isOn}
                aria-label={item.label}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  isOn ? "bg-accent" : "bg-[#2a2a2e]"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ease-out ${
                    isOn ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* No card warning */}
            {showCardWarning && (
              <Link
                href="/editor"
                className="mt-1 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 transition-colors active:bg-amber-500/12"
              >
                <span className="text-sm">🎴</span>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-amber-400">선수카드를 먼저 만들어주세요</p>
                  <p className="text-[10px] text-text-3">에디터에서 카드를 만들고 저장하면 인트로에 자동 적용돼요</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
