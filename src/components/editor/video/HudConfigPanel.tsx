"use client";

import type { HudConfig } from "@/components/video/hud/types";

interface HudConfigPanelProps {
  config: HudConfig;
  onChange: (config: HudConfig) => void;
}

const TOGGLES: { key: keyof HudConfig; label: string }[] = [
  { key: "showTopBar",     label: "상단 타이틀바" },
  { key: "showMiniCard",   label: "선수 미니카드" },
  { key: "showInfoBar",    label: "스탯 정보바" },
  { key: "showGoalCounter", label: "골 카운터" },
];

export default function HudConfigPanel({ config, onChange }: HudConfigPanelProps) {
  const toggle = (key: keyof HudConfig) => {
    if (key === "goalCount") return;
    onChange({ ...config, [key]: !config[key as keyof HudConfig] });
  };

  return (
    <div className="rounded-xl bg-white/4 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white/50 tracking-wide">HUD 오버레이</span>
        {/* Goal count stepper */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">골</span>
          <button
            onClick={() => onChange({ ...config, goalCount: Math.max(0, config.goalCount - 1) })}
            className="flex h-5 w-5 items-center justify-center rounded text-white/60 hover:bg-white/10 text-xs"
          >−</button>
          <span className="min-w-[1.5ch] text-center text-xs font-bold text-[#D4A853]">
            {config.goalCount}
          </span>
          <button
            onClick={() => onChange({ ...config, goalCount: config.goalCount + 1 })}
            className="flex h-5 w-5 items-center justify-center rounded text-white/60 hover:bg-white/10 text-xs"
          >+</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOGGLES.map(({ key, label }) => {
          const active = config[key as keyof HudConfig] as boolean;
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all"
              style={{
                background: active ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.06)",
                color: active ? "#D4A853" : "rgba(255,255,255,0.4)",
                border: `1px solid ${active ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
