"use client";

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
  { key: "color" as const, label: "색보정", description: "밝기·채도 자동 보정" },
  { key: "cinematic" as const, label: "시네마틱 바", description: "상하 레터박스" },
  { key: "eafc" as const, label: "EA FC 카드", description: "선수 정보 오버레이" },
  { key: "intro" as const, label: "인트로 카드", description: "2초 선수 소개" },
];

export default function EffectsToggle({ effects, onChange }: EffectsToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      {EFFECT_ITEMS.map((item) => {
        const isOn = effects[item.key];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange({ [item.key]: !isOn })}
            className="flex items-center justify-between rounded-xl bg-card px-4 py-3.5"
          >
            <div className="flex flex-col items-start">
              <span className="text-[14px] font-medium text-text-1">
                {item.label}
              </span>
              <span className="text-[11px] text-text-3">
                {item.description}
              </span>
            </div>

            {/* 토글 스위치 */}
            <div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isOn ? "bg-accent" : "bg-[#2a2a2e]"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isOn ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
