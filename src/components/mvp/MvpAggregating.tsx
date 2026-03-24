"use client";

import { useEffect, useState } from "react";

export default function MvpAggregating() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      {/* 트로피 애니메이션 */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(212,168,83,0.12)", animationDuration: "2s" }}
        />
        <div
          className="absolute inset-2 rounded-full animate-ping"
          style={{ background: "rgba(212,168,83,0.08)", animationDuration: "2.5s", animationDelay: "0.3s" }}
        />
        <span className="relative text-5xl">🏆</span>
      </div>

      {/* 타이틀 */}
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--color-accent)" }}
        >
          Monthly MVP
        </p>
        <h2 className="mt-1 text-xl font-bold text-text-1">MVP 집계 중{dots}</h2>
      </div>

      {/* 설명 */}
      <div
        className="w-full max-w-[280px] rounded-[12px] px-5 py-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[13px] font-semibold text-text-1">매월 1일 새벽, 전월 MVP를 집계합니다</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-3">
          이달의 1~3위를 선정하고 있어요.
          <br />
          오전 6시 이후에 결과가 발표됩니다.
        </p>
      </div>

      {/* 진행 바 */}
      <div className="w-full max-w-[240px]">
        <div
          className="h-1 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "var(--accent-gradient)",
              width: "60%",
              animation: "mvp-progress 2s ease-in-out infinite alternate",
            }}
          />
        </div>
        <p className="mt-2 text-[10px] text-text-3">투표 결과 산정 중</p>
      </div>

      <style jsx>{`
        @keyframes mvp-progress {
          from { width: 40%; }
          to { width: 85%; }
        }
      `}</style>
    </div>
  );
}
