"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "@/lib/constants";

interface Props {
  onBack: () => void;
}

export default function ScoutOnboarding({ onBack }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [organization, setOrganization] = useState("");
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
          bio: organization ? `스카우터 · ${organization}` : "스카우터",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "프로필 생성에 실패했어요");
        setSubmitting(false);
        return;
      }

      router.push("/");
    } catch {
      alert("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, name, handle, organization, router]);

  return (
    <div className="animate-fade-up flex-1">
      <h1 className="text-2xl font-bold text-text-1">스카우터 정보</h1>
      <p className="mt-2 text-sm text-text-2">유망한 선수를 발굴하시나요?</p>

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

      <p className="mt-4 text-xs text-text-3">
        스카우터 인증은 추후 프로필 설정에서 진행할 수 있어요.
      </p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text-2"
        >
          이전
        </button>
        <button
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-40"
        >
          {submitting ? "생성 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}
