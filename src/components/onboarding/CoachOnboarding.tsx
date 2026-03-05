"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "@/lib/constants";

const COACH_ROLES = [
  { value: "head_coach", label: "감독" },
  { value: "coach", label: "코치" },
  { value: "scout", label: "스카우터" },
  { value: "other", label: "기타" },
] as const;

interface Props {
  onBack: () => void;
}

export default function CoachOnboarding({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 인증, 3: 완료
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [teamName, setTeamName] = useState("");
  const [coachRole, setCoachRole] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Step 2: 인증
  const [verifyMethod, setVerifyMethod] = useState<"code" | "document" | "skip" | "">("");
  const [teamCode, setTeamCode] = useState("");

  // Handle check
  useEffect(() => {
    if (!handle) {
      setHandleStatus("idle");
      return;
    }
    if (!HANDLE_REGEX.test(handle)) {
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

  const canProceedStep1 =
    name.trim().length >= 1 && handleStatus === "available" && coachRole;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. 프로필 생성
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "other",
          name: name.trim(),
          handle,
          position: null,
          birth_year: null,
          avatar_url: null,
          bio: coachRole ? `${COACH_ROLES.find(r => r.value === coachRole)?.label ?? ""} ${teamName ? `· ${teamName}` : ""}`.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "프로필 생성에 실패했어요");
        setSubmitting(false);
        return;
      }

      // 2. 인증 요청 (코드 입력 시)
      if (verifyMethod === "code" && teamCode.trim()) {
        await fetch("/api/coach/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "team_code",
            team_code: teamCode.trim(),
          }),
        });
      }

      router.push("/");
    } catch {
      alert("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, name, handle, coachRole, teamName, verifyMethod, teamCode, router]);

  return (
    <div className="flex-1">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: 기본 정보 */}
      {step === 1 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-text-1">코치/스카우터 정보</h1>
          <p className="mt-2 text-sm text-text-2">선수를 지도하거나 발굴하시나요?</p>

          <div className="mt-8 flex flex-col gap-5">
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
              {handleStatus === "checking" && <p className="mt-1 text-xs text-text-3">확인 중...</p>}
              {handleStatus === "available" && <p className="mt-1 text-xs text-green">사용 가능한 핸들이에요</p>}
              {handleStatus === "taken" && <p className="mt-1 text-xs text-red">이미 사용 중인 핸들이에요</p>}
              {handleStatus === "invalid" && <p className="mt-1 text-xs text-red">3~20자, 영소문자/숫자/밑줄만 가능</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">역할</label>
              <div className="grid grid-cols-2 gap-2">
                {COACH_ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setCoachRole(r.value)}
                    className={`rounded-lg border py-2.5 text-sm font-semibold transition-all ${
                      coachRole === r.value
                        ? "border-accent bg-[var(--accent-bg)] text-accent"
                        : "border-border bg-card text-text-2"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">소속 팀/기관 (선택)</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="소속 팀명"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                maxLength={30}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onBack}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text-2"
            >
              이전
            </button>
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 인증 */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-text-1">인증 (선택)</h1>
          <p className="mt-2 text-sm text-text-2">
            인증하면 ✅ 뱃지가 표시되고 선수에게 DM을 보낼 수 있어요
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {/* 팀 코드 입력 */}
            <button
              onClick={() => setVerifyMethod("code")}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                verifyMethod === "code"
                  ? "border-accent bg-[var(--accent-bg)]"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-2xl">🔑</span>
              <div>
                <p className="font-semibold text-text-1">팀 코드 입력</p>
                <p className="text-xs text-text-3">소속 팀에서 받은 코드를 입력하세요</p>
              </div>
            </button>

            {/* 증빙 제출 */}
            <button
              onClick={() => setVerifyMethod("document")}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                verifyMethod === "document"
                  ? "border-accent bg-[var(--accent-bg)]"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-text-1">증빙 제출</p>
                <p className="text-xs text-text-3">자격증 등 증빙 자료를 업로드하세요</p>
              </div>
            </button>

            {/* 팀 코드 입력 필드 */}
            {verifyMethod === "code" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  placeholder="팀 코드를 입력하세요"
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                  maxLength={20}
                />
              </div>
            )}

            {/* 증빙 업로드 안내 */}
            {verifyMethod === "document" && (
              <div className="mt-2 rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-text-2">
                  프로필 생성 후 설정에서 증빙 자료를 업로드할 수 있어요.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-60"
            >
              {submitting ? "생성 중..." : "시작하기"}
            </button>
            <button
              disabled={submitting}
              onClick={() => {
                setVerifyMethod("skip");
                handleSubmit();
              }}
              className="text-sm text-text-3"
            >
              나중에 인증할게요
            </button>
            <button onClick={() => setStep(1)} className="text-sm text-text-3">
              이전으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
