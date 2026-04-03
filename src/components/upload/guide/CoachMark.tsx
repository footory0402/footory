"use client";

import type { GuideStep } from "@/hooks/useUploadGuide";

interface CoachMarkProps {
  step: GuideStep;
  onDismiss: () => void;
  onSkipAll: () => void;
}

const STEPS: Record<GuideStep, { message: string; sub: string }> = {
  tap: {
    message: "영상을 탭하면 선수 위치를 표시할 수 있어요",
    sub: "경기 영상에서 내 위치를 알려주세요",
  },
  pinch: {
    message: "두 손가락으로 확대해서 정확하게 위치를 잡아보세요",
    sub: "최대 5배까지 확대할 수 있어요",
  },
};

function TapGesture() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      {/* Ripple */}
      <div
        className="absolute rounded-full"
        style={{
          width: 28,
          height: 28,
          background: "rgba(212,168,83,0.25)",
          animation: "guide-ripple 2s ease-out infinite",
        }}
      />
      {/* Finger */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "guide-tap 2s ease-in-out infinite" }}
      >
        <path
          d="M12 1a2 2 0 0 1 2 2v6.5a2 2 0 0 1 4 0V11a2 2 0 0 1 4 0v3c0 5.523-3.477 9-8 9-4.523 0-8-3.477-8-9V9.5a2 2 0 0 1 4 0V3a2 2 0 0 1 2-2z"
          fill="rgba(255,255,255,0.85)"
          stroke="rgba(212,168,83,0.6)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

function PinchGesture() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      {/* Left dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          background: "rgba(255,255,255,0.7)",
          border: "2px solid rgba(212,168,83,0.5)",
          left: "50%",
          top: "50%",
          marginLeft: -10,
          marginTop: -10,
          animation: "guide-pinch-l 2.5s ease-in-out infinite",
        }}
      />
      {/* Right dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          background: "rgba(255,255,255,0.7)",
          border: "2px solid rgba(212,168,83,0.5)",
          left: "50%",
          top: "50%",
          marginLeft: -10,
          marginTop: -10,
          animation: "guide-pinch-r 2.5s ease-in-out infinite",
        }}
      />
      {/* Expand arrows between dots */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
        <path d="M4 20L10 14M20 4L14 10" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 16V20H8M20 8V4H16" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function CoachMark({ step, onDismiss, onSkipAll }: CoachMarkProps) {
  const { message, sub } = STEPS[step];
  const stepIndex = step === "tap" ? 0 : 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "rgba(7,7,9,0.78)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Gesture animation */}
      <div className="mb-6">
        {step === "tap" ? <TapGesture /> : <PinchGesture />}
      </div>

      {/* Message card */}
      <div
        className="mx-6 rounded-2xl px-6 py-5 text-center"
        style={{
          background: "#1C1C22",
          border: "1px solid rgba(212,168,83,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.3s ease-out",
        }}
      >
        <p className="text-[15px] font-semibold text-white leading-snug">{message}</p>
        <p className="mt-1.5 text-[12px] text-white/40">{sub}</p>

        {/* Step indicator */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === stepIndex ? 16 : 6,
                height: 6,
                background: i === stepIndex ? "#D4A853" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl py-2.5 text-[14px] font-bold text-[#070709] active:scale-[0.98]"
            style={{ background: "#D4A853" }}
          >
            확인
          </button>
          <button
            type="button"
            onClick={onSkipAll}
            className="py-1 text-[12px] text-white/30 active:text-white/50"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
