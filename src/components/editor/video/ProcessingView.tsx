"use client";

export type ProcessingStep = "loading" | "trimming" | "concat" | "uploading" | "saving";

interface ProcessingViewProps {
  step: ProcessingStep;
  trimProgress: number; // 0~totalClips
  totalClips: number;
  error?: string;
  onRetry?: () => void;
}

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: "loading", label: "영상 준비" },
  { key: "trimming", label: "구간 자르기" },
  { key: "concat", label: "하나로 합치기" },
  { key: "uploading", label: "업로드" },
  { key: "saving", label: "저장" },
];

export default function ProcessingView({ step, trimProgress, totalClips, error, onRetry }: ProcessingViewProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const progress = Math.round(((currentIdx + (step === "trimming" ? trimProgress / totalClips : 0)) / STEPS.length) * 100);

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-[32px]">✕</div>
        <h2 className="mt-5 text-[16px] font-bold text-white">처리 중 문제가 발생했어요</h2>
        <p className="mt-2 text-center text-[13px] text-white/50">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 rounded-xl bg-accent px-8 py-3 text-[14px] font-bold text-black active:scale-[0.98]"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-8">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(212,168,83,0.15)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="36" fill="none" stroke="#D4A853" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="text-[18px] font-extrabold text-accent">{progress}%</span>
      </div>

      <h2 className="mt-5 text-[15px] font-bold text-white">구간을 합치고 있어요</h2>
      <p className="mt-1 text-[12px] text-white/40">잠깐만 기다려주세요...</p>

      <div className="mt-6 flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const label = s.key === "trimming" && isCurrent
            ? `${s.label} (${trimProgress}/${totalClips})`
            : s.label;
          return (
            <div key={s.key} className="flex items-center gap-2 text-[12px]">
              <span className={isDone ? "text-green-400" : isCurrent ? "text-accent" : "text-white/20"}>
                {isDone ? "✓" : isCurrent ? "●" : "○"}
              </span>
              <span className={isCurrent ? "font-semibold text-white" : isDone ? "text-white/50" : "text-white/20"}>
                {label}{isCurrent && "..."}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
