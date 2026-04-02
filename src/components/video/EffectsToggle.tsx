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

export default function EffectsToggle({ effects, onChange }: EffectsToggleProps) {
  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const [cardInfo, setCardInfo] = useState<{ name: string; template: string; color: string } | null>(null);

  useEffect(() => {
    fetch("/api/player-card")
      .then((r) => {
        if (!r.ok) { setHasCard(false); return; }
        return r.json();
      })
      .then((res) => {
        if (res?.card) {
          setHasCard(true);
          const cd = res.card.card_data as Record<string, string>;
          setCardInfo({
            name: `${cd.lastName || ""}${cd.firstName || ""}`.trim() || "이름 없음",
            template: "방송 스타일",
            color: res.card.accent_color || "#D4A853",
          });
        } else {
          setHasCard(false);
        }
      })
      .catch(() => setHasCard(false));
  }, []);

  const isOn = effects.intro;

  return (
    <div className="flex flex-col gap-1">
      {/* Intro Card Toggle */}
      <button
        type="button"
        onClick={() => onChange({ intro: !isOn })}
        className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3.5"
      >
        <div className="flex flex-col items-start">
          <span className="text-[14px] font-medium text-text-1">
            선수 카드 인트로
            {hasCard && (
              <span className="ml-1.5 text-[10px] text-accent">카드 저장됨 ✓</span>
            )}
          </span>
          <span className="text-[11px] text-text-3">
            영상 시작 전 2초간 선수 소개 카드가 표시돼요
          </span>
        </div>
        <div
          role="switch"
          aria-checked={isOn}
          aria-label="선수 카드 인트로"
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

      {/* Card preview when ON + card exists */}
      {isOn && hasCard && cardInfo && (
        <Link
          href="/editor"
          className="mt-1 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card px-4 py-3 transition-colors active:bg-surface"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: cardInfo.color }}
          >
            🎴
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-1 truncate">{cardInfo.name}</p>
            <p className="text-[10px] text-text-3">{cardInfo.template} · 탭하여 수정</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}

      {/* No card warning */}
      {isOn && hasCard === false && (
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
}
