"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RecapData {
  childName: string;
  newClips: number;
  clipsDelta: number;
  kudos: number;
  kudosDelta: number;
  views: number;
  viewsDelta: number;
  mvpRank: number | null;
  level: number;
  levelChanged: boolean;
}

interface WeeklyRecapProps {
  childId: string;
  childName: string;
  childHandle?: string;
}

export default function WeeklyRecap({ childId, childName, childHandle }: WeeklyRecapProps) {
  const router = useRouter();
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedKey = `recap_dismissed_${childId}_${getWeekKey()}`;
    if (localStorage.getItem(dismissedKey)) {
      setLoading(false);
      return;
    }

    async function fetchRecap() {
      try {
        const res = await fetch(`/api/parent/recap?childId=${childId}`);
        if (res.ok) {
          const data = await res.json();
          setRecap(data);
        }
      } catch {
        // Silently fail — recap is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchRecap();
  }, [childId]);

  if (loading || !recap || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(`recap_dismissed_${childId}_${getWeekKey()}`, "1");
  };

  return (
    <div className="mb-4 rounded-xl border border-accent/20 bg-gradient-to-br from-card to-accent/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-text-1">
          {childName}의 지난주 리캡
        </h3>
        <button onClick={dismiss} className="text-[12px] text-text-3">
          닫기
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <RecapRow emoji="📹" label="영상" value={`${recap.newClips}개`} delta={recap.clipsDelta} />
        <RecapRow emoji="👏" label="응원" value={`${recap.kudos}개`} delta={recap.kudosDelta} />
        <RecapRow emoji="👁" label="조회" value={`${recap.views}회`} delta={recap.viewsDelta} />
        {recap.mvpRank && (
          <RecapRow emoji="🏆" label="MVP" value={`${recap.mvpRank}위`} />
        )}
        <RecapRow
          emoji="📈"
          label="레벨"
          value={`Lv.${recap.level}`}
          delta={recap.levelChanged ? 1 : undefined}
          deltaLabel={recap.levelChanged ? "UP!" : "변동 없음"}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            dismiss();
            router.push(`/p/${childHandle ?? childName}?tab=records`);
          }}
          className="flex-1 rounded-xl bg-accent/10 py-2 text-[13px] font-medium text-accent"
        >
          자세히 보기
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${childName}의 주간 리캡`,
                text: `이번 주 영상 ${recap.newClips}개, 응원 ${recap.kudos}개!`,
              });
            }
          }}
          className="flex-1 rounded-xl border border-border py-2 text-[13px] font-medium text-text-2"
        >
          공유하기
        </button>
      </div>
    </div>
  );
}

function RecapRow({
  emoji,
  label,
  value,
  delta,
  deltaLabel,
}: {
  emoji: string;
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-2">
        {emoji} {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-oswald text-[14px] font-semibold text-text-1">{value}</span>
        {delta !== undefined && (
          <span className={`text-[11px] ${delta > 0 ? "text-green" : delta < 0 ? "text-red" : "text-text-3"}`}>
            {deltaLabel ?? (delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "—")}
          </span>
        )}
        {delta === undefined && deltaLabel && (
          <span className="text-[11px] text-text-3">{deltaLabel}</span>
        )}
      </div>
    </div>
  );
}

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const weekNum = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}-W${weekNum}`;
}
