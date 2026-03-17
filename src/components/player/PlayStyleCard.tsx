"use client";

import { PLAY_STYLES, STYLE_TRAIT_LABELS, type PlayStyleType, type StyleTraitKey } from "@/lib/constants";
import { normalizeTraitTo10 } from "@/lib/types";

interface PlayStyleCardProps {
  styleType: PlayStyleType;
  traits: Record<StyleTraitKey, number>; // raw 0~15
  onRetest?: () => void;
  compact?: boolean; // 홈 탭용 축약 모드
}

export default function PlayStyleCard({ styleType, traits, onRetest, compact }: PlayStyleCardProps) {
  const style = PLAY_STYLES[styleType];
  if (!style) return null;

  const traitEntries = (Object.entries(STYLE_TRAIT_LABELS) as [StyleTraitKey, string][]).map(
    ([key, label]) => ({
      key,
      label,
      raw: traits[key] ?? 0,
      normalized: normalizeTraitTo10(traits[key] ?? 0),
    })
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-text-1">{style.label}</p>
          <p className="text-[11px] text-text-3 truncate">{style.description}</p>
        </div>
        <div className="flex gap-1">
          {traitEntries.map(({ key, normalized }) => (
            <div
              key={key}
              className="h-5 w-1 rounded-full"
              style={{
                background: normalized >= 7
                  ? "#D4A853"
                  : normalized >= 4
                    ? "rgba(212,168,83,0.4)"
                    : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{style.icon}</span>
          <div>
            <p className="text-[16px] font-bold text-text-1">{style.label}</p>
            <p className="text-[12px] text-text-3">&ldquo;{style.description}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Trait bars */}
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {traitEntries.map(({ key, label, normalized }) => (
          <div key={key} className="flex items-center gap-2.5">
            <span className="w-8 text-[11px] font-bold text-text-3 shrink-0">{label}</span>
            <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full animate-grow-w"
                style={{
                  width: `${(normalized / 10) * 100}%`,
                  background:
                    normalized >= 8
                      ? "linear-gradient(90deg, #D4A853, #F5D78E)"
                      : normalized >= 5
                        ? "rgba(212,168,83,0.6)"
                        : "rgba(212,168,83,0.3)",
                }}
              />
            </div>
            <span
              className="w-5 text-right text-[12px] font-bold tabular-nums shrink-0"
              style={{
                fontFamily: "var(--font-stat)",
                color: normalized >= 8 ? "#D4A853" : normalized >= 5 ? "#A1A1AA" : "#71717A",
              }}
            >
              {normalized}
            </span>
          </div>
        ))}
      </div>

      {/* Retest button */}
      {onRetest && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <button
            onClick={onRetest}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] py-2.5 text-[12px] font-semibold text-text-2 transition-colors active:bg-white/[0.10]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            다시 테스트하기
          </button>
        </div>
      )}
    </div>
  );
}
