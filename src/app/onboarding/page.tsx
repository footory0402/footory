"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = ["FW", "MF", "DF", "GK"] as const;
const ROLES = [
  { value: "player", label: "선수", emoji: "⚽", desc: "직접 뛰는 선수예요" },
  { value: "parent", label: "부모", emoji: "👨‍👩‍👦", desc: "자녀의 성장을 기록해요" },
  { value: "other", label: "기타", emoji: "👀", desc: "스카우터, 코치 등" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [role, setRole] = useState<string>("");

  // Step 2
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [position, setPosition] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  // Debounced handle check
  useEffect(() => {
    if (!handle) {
      setHandleStatus("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/handle-check?handle=${handle}`);
        const data = await res.json();
        setHandleStatus(data.available ? "available" : "taken");
      } catch {
        setHandleStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [handle]);

  const canProceedStep2 =
    name.trim().length >= 1 &&
    handleStatus === "available" &&
    (role !== "player" || position);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: name.trim(),
          handle,
          position: role === "player" ? position : null,
          birth_year: birthYear ? parseInt(birthYear) : null,
          avatar_url: null,
        }),
      });

      if (res.ok) {
        router.push("/profile");
      } else {
        const data = await res.json();
        alert(data.error || "프로필 생성에 실패했어요");
        setSubmitting(false);
      }
    } catch {
      alert("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, role, name, handle, position, birthYear, router]);

  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="animate-fade-up flex-1">
          <h1 className="text-2xl font-bold text-text-1">반가워요!</h1>
          <p className="mt-2 text-sm text-text-2">어떤 역할로 사용하시나요?</p>

          <div className="mt-8 flex flex-col gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  role === r.value
                    ? "border-accent bg-[var(--accent-bg)]"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <p className="font-semibold text-text-1">{r.label}</p>
                  <p className="text-xs text-text-3">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            disabled={!role}
            onClick={() => setStep(2)}
            className="mt-8 w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: Info */}
      {step === 2 && (
        <div className="animate-fade-up flex-1">
          <h1 className="text-2xl font-bold text-text-1">기본 정보</h1>
          <p className="mt-2 text-sm text-text-2">프로필에 표시될 정보를 입력해주세요</p>

          <div className="mt-8 flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                maxLength={20}
              />
            </div>

            {/* Handle */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">핸들</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-3">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="my_handle"
                  className="w-full rounded-lg border border-border bg-card py-3 pl-9 pr-4 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                  maxLength={20}
                />
              </div>
              {handleStatus === "checking" && (
                <p className="mt-1 text-xs text-text-3">확인 중...</p>
              )}
              {handleStatus === "available" && (
                <p className="mt-1 text-xs text-green">사용 가능한 핸들이에요</p>
              )}
              {handleStatus === "taken" && (
                <p className="mt-1 text-xs text-red">이미 사용 중인 핸들이에요</p>
              )}
              {handleStatus === "invalid" && (
                <p className="mt-1 text-xs text-red">3~20자, 영소문자/숫자/밑줄만 가능</p>
              )}
            </div>

            {/* Position (player only) */}
            {role === "player" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">포지션</label>
                <div className="flex gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-all ${
                        position === pos
                          ? "border-accent bg-[var(--accent-bg)] text-accent"
                          : "border-border bg-card text-text-2"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Birth year */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">출생연도 (선택)</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="2010"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                min={1990}
                max={2025}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text-2"
            >
              이전
            </button>
            <button
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Profile photo (skip or complete) */}
      {step === 3 && (
        <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border">
            <svg className="h-10 w-10 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-text-1">프로필 사진</h1>
          <p className="mt-2 text-sm text-text-2">나중에 설정할 수도 있어요</p>

          <div className="mt-10 flex w-full flex-col gap-3">
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-60"
            >
              {submitting ? "프로필 생성 중..." : "시작하기"}
            </button>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-text-3"
            >
              이전으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
