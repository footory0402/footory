"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "@/lib/constants";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

const SUB_ROLES = ["감독", "코치", "스카우터", "트레이너"] as const;

export default function ScoutOnboarding({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [organization, setOrganization] = useState("");
  const [subRole, setSubRole] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Handle check
  /* eslint-disable react-hooks/set-state-in-effect */
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
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/handle-check?handle=${handle}`);
        const data = await res.json();
        if (!cancelled) {
          setHandleStatus(data.available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) setHandleStatus("idle");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const canSubmit = name.trim().length >= 1 && handleStatus === "available";
  const canNext = canSubmit;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "scout",
          name: name.trim(),
          handle,
          position: null,
          birth_year: null,
          avatar_url: null,
          bio: organization ? `${subRole || "스카우터"} · ${organization}` : (subRole || "스카우터"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "프로필 생성에 실패했어요");
        setSubmitting(false);
        return;
      }

      router.push("/");
    } catch {
      toast.error("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, name, handle, organization, subRole, router]);

  if (step === 2) {
    return (
      <div className="animate-fade-up flex-1">
        <h1 className="text-2xl font-bold text-text-1">인증 (선택)</h1>
        <p className="mt-2 text-sm text-text-2">인증을 통해 신뢰도를 높여보세요</p>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <span className="text-2xl">🏷️</span>
            <div className="flex-1">
              <p className="font-semibold text-text-1">팀 코드 입력</p>
              <p className="text-xs text-text-3">소속 팀의 코드로 즉시 인증</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="font-semibold text-text-1">증빙 제출</p>
              <p className="text-xs text-text-3">자격증 또는 소속 증명 서류 제출</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-text-3">
          인증은 나중에 프로필 설정에서도 할 수 있어요.
        </p>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text-2"
          >
            이전
          </button>
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
          >
            {submitting ? "생성 중..." : "시작하기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex-1">
      <h1 className="text-2xl font-bold text-text-1">코치/스카우터 정보</h1>
      <p className="mt-2 text-sm text-text-2">코치하거나 유망한 선수를 발굴하시나요?</p>

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-2">역할</label>
          <div className="flex flex-wrap gap-2">
            {SUB_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSubRole(r)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  subRole === r
                    ? "bg-accent text-bg"
                    : "border border-border bg-card text-text-2"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

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
          <label className="mb-1.5 block text-xs font-medium text-text-2">내 프로필 주소</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-3">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="my_handle"
              className={`w-full rounded-lg border bg-card py-3 pl-9 pr-8 text-sm text-text-1 placeholder:text-text-3 focus:outline-none transition-colors ${
                handleStatus === "available" ? "border-green" :
                handleStatus === "taken" || handleStatus === "invalid" ? "border-red" :
                handleStatus === "checking" ? "border-yellow" :
                "border-border focus:border-accent"
              }`}
              maxLength={20}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {handleStatus === "checking" && (
                <svg className="h-4 w-4 animate-spin text-yellow" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {handleStatus === "available" && (
                <svg className="h-4 w-4 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {(handleStatus === "taken" || handleStatus === "invalid") && (
                <svg className="h-4 w-4 text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </span>
          </div>
          {handleStatus === "idle" && <p className="mt-1 text-xs text-text-3">영문 소문자, 숫자, _(언더스코어) 3~20자</p>}
          {handleStatus === "checking" && <p className="mt-1 text-xs text-text-3">확인 중...</p>}
          {handleStatus === "available" && <p className="mt-1 text-xs text-green">사용 가능한 주소예요 ✓</p>}
          {handleStatus === "taken" && <p className="mt-1 text-xs text-red">⚠ 이미 사용 중인 주소예요</p>}
          {handleStatus === "invalid" && <p className="mt-1 text-xs text-red">⚠ 3~20자, 영문 소문자·숫자·_(언더스코어)만 가능</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-2">소속 기관 (선택)</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="소속 기관명"
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
          disabled={!canNext}
          onClick={() => setStep(2)}
          className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
