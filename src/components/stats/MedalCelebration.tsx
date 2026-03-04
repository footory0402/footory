"use client";

import type { AwardedMedal } from "@/lib/medals";

interface MedalCelebrationProps {
  medals: AwardedMedal[];
  onClose: () => void;
}

export default function MedalCelebration({ medals, onClose }: MedalCelebrationProps) {
  if (medals.length === 0) return null;

  const handleShare = async () => {
    const text = medals.map((m) => `${m.icon} ${m.label}`).join(", ");
    const shareText = `새 메달을 획득했어요! ${text} - Footory`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70" onClick={onClose} />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <div className="w-full max-w-[340px] animate-scale-up rounded-2xl bg-card p-6 text-center">
          {/* Celebration header */}
          <div className="mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="mb-1 text-xl font-bold text-text-1">메달 획득!</h2>
          <p className="mb-5 text-xs text-text-3">축하합니다! 새로운 메달을 획득했어요</p>

          {/* Medal list */}
          <div className="mb-6 flex flex-col gap-3">
            {medals.map((medal) => (
              <div
                key={medal.id}
                className="flex items-center gap-3 rounded-xl bg-bg px-4 py-3"
              >
                <span className="text-2xl">{medal.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-accent">{medal.label}</p>
                  <p className="text-xs text-text-3">
                    {medal.statType} {medal.comparison === "lte" ? "≤" : "≥"} {medal.threshold}
                  </p>
                </div>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  NEW!
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleShare}
              className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-black"
            >
              자랑하기
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-lg py-3 text-sm font-medium text-text-3"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
