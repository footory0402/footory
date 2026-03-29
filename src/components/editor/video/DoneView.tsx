"use client";

import { useRouter } from "next/navigation";

interface DoneViewProps {
  clipCount: number;
  totalDuration: number;
  videoUrl?: string;
  onReset: () => void;
}

export default function DoneView({ clipCount, totalDuration, videoUrl, onReset }: DoneViewProps) {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-6">
      <div className="flex gap-1.5 mb-6">
        <div className="h-1 w-8 rounded-full bg-green-400" />
        <div className="h-1 w-8 rounded-full bg-green-400" />
        <div className="h-1 w-8 rounded-full bg-green-400" />
      </div>

      {/* 결과 영상 미리보기 */}
      {videoUrl && (
        <div className="mb-5 w-full max-w-sm overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <video
            src={videoUrl}
            controls
            playsInline
            className="aspect-video w-full bg-black"
          />
        </div>
      )}

      {!videoUrl && (
        <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-green-400 bg-green-400/15 text-[28px] animate-scale-up">
          ✓
        </div>
      )}

      <h2 className="text-[18px] font-extrabold text-white">하이라이트 완성!</h2>
      <p className="mt-1 text-[13px] text-white/50">{clipCount}개 구간 · {Math.round(totalDuration)}초</p>
      <p className="mt-1 text-[12px] text-white/30">프로필에서 확인할 수 있어요</p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-extrabold text-black active:scale-[0.98]"
        >
          프로필에서 보기
        </button>
        <button
          onClick={onReset}
          className="py-3 text-[13px] text-white/40 active:text-white/60"
        >
          한 번 더 만들기
        </button>
      </div>

      <style jsx>{`
        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scale-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}
