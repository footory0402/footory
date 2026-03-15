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
  { key: "color" as const, label: "색보정", description: "밝기와 채도를 자동으로 보정해요" },
  { key: "cinematic" as const, label: "영화 느낌 바", description: "위아래에 검은 바가 생겨 영화처럼 보여요" },
  { key: "eafc" as const, label: "선수 카드 효과", description: "하단에 등번호·이름·포지션이 표시돼요" },
  { key: "intro" as const, label: "인트로 카드", description: "영상 시작 전 2초간 선수 소개가 나와요" },
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
        );
      })}
    </div>
  );
}
