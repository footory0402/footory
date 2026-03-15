import React, { useState } from "react";

interface StatRowProps {
  icon: string;
  label: string;
  value: number;
  unit: string;
  type?: string;
  previousValue?: number;
  verified?: boolean;
  lowerIsBetter?: boolean;
  /** 신고 가능 여부 (공개 프로필에서 타인 기록 조회 시) */
  statId?: string;
  profileId?: string;
  onReport?: (statId: string, profileId: string) => void;
}

function StatRow({ icon, label, value, unit, previousValue, verified, lowerIsBetter = false, statId, profileId, onReport }: StatRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const diff = previousValue != null ? value - previousValue : null;
  const improved = diff != null && diff !== 0 && (lowerIsBetter ? diff < 0 : diff > 0);

  return (
    <div className="relative flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
      {/* Icon */}
      <span className="text-base shrink-0">{icon}</span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-medium text-text-2 truncate block">{label}</span>
      </div>

      {/* Value + diff */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-stat text-[18px] font-bold text-text-1 leading-none">{value}</span>
        <span className="text-[11px] text-text-3">{unit}</span>
        {verified && (
          <span className="text-[9px] font-bold text-accent">✓</span>
        )}
      </div>

      {/* Growth indicator */}
      {diff != null && diff !== 0 && (
        <span className={`text-[11px] font-bold shrink-0 ${improved ? "text-accent" : "text-text-3"}`}>
          {lowerIsBetter
            ? (diff < 0 ? `↓${Math.abs(diff).toFixed(1)}` : `↑${diff.toFixed(1)}`)
            : (diff > 0 ? `↑${diff.toFixed(1)}` : `↓${Math.abs(diff).toFixed(1)}`)
          }
        </span>
      )}

      {/* First record badge */}
      {diff == null && previousValue == null && (
        <span className="text-[10px] text-accent/60 shrink-0">NEW</span>
      )}

      {/* 신고 버튼 (타인 프로필) */}
      {onReport && statId && profileId && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-text-3 hover:bg-white/[0.06] active:bg-white/[0.1]"
            aria-label="더보기"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-xl bg-card border border-white/[0.08] shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReport(statId, profileId);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-medium text-red-400 hover:bg-white/[0.04] active:bg-white/[0.08]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  기록 신고
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default React.memo(StatRow);
