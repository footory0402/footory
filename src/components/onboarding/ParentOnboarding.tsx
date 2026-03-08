"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HANDLE_REGEX } from "@/lib/constants";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

interface SearchResult {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
}

export default function ParentOnboarding({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 자녀연결
  const [submitting, setSubmitting] = useState(false);

  // Step 1: 기본 정보
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Step 2: 자녀 검색
  const [childQuery, setChildQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedChild, setLinkedChild] = useState<SearchResult | null>(null);

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

  const canProceedStep1 = name.trim().length >= 1 && handleStatus === "available";

  // 자녀 검색
  const searchChild = useCallback(async () => {
    if (!childQuery.trim()) return;
    setSearching(true);
    try {
      const q = childQuery.trim().replace(/^@/, "");
      const res = await fetch(`/api/profile/search?q=${encodeURIComponent(q)}&role=player`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [childQuery]);

  const handleSubmit = useCallback(
    async (skipChild = false) => {
      if (submitting) return;
      setSubmitting(true);

      try {
        // 1. 프로필 생성
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "parent",
            name: name.trim(),
            handle,
            position: null,
            birth_year: null,
            avatar_url: null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "프로필 생성에 실패했어요");
          setSubmitting(false);
          return;
        }

        // 2. 자녀 연결 (선택)
        if (!skipChild && linkedChild) {
          await fetch("/api/parent/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ child_handle: linkedChild.handle }),
          });
        }

        router.push("/");
      } catch {
        toast.error("네트워크 오류가 발생했어요");
        setSubmitting(false);
      }
    },
    [submitting, name, handle, linkedChild, router]
  );

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
          <h1 className="text-2xl font-bold text-text-1">보호자 정보</h1>
          <p className="mt-2 text-sm text-text-2">자녀의 성장을 함께 기록해요</p>

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

      {/* Step 2: 자녀 연결 */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-text-1">자녀 연결</h1>
          <p className="mt-2 text-sm text-text-2">자녀의 Footory 계정을 연결하세요</p>

          <div className="mt-8 flex flex-col gap-5">
            {/* 검색 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">이름 또는 @핸들로 검색</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={childQuery}
                  onChange={(e) => setChildQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchChild()}
                  placeholder="이름 또는 @핸들"
                  className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                />
                <button
                  onClick={searchChild}
                  disabled={searching || !childQuery.trim()}
                  className="rounded-lg bg-card px-4 py-3 text-sm font-medium text-accent disabled:opacity-40"
                >
                  {searching ? "..." : "검색"}
                </button>
              </div>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setLinkedChild(result)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      linkedChild?.id === result.id
                        ? "border-accent bg-[var(--accent-bg)]"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border text-sm text-text-3">
                      {result.avatar_url ? (
                        <Image
                          src={result.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          sizes="40px"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        result.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-1">{result.name}</p>
                      <p className="text-xs text-text-3">@{result.handle} {result.position && `· ${result.position}`}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 연결된 자녀 */}
            {linkedChild && (
              <div className="rounded-xl border border-accent/30 bg-[var(--accent-bg)] p-4">
                <p className="text-xs font-medium text-accent">연결할 자녀</p>
                <p className="mt-1 text-sm font-semibold text-text-1">
                  {linkedChild.name} (@{linkedChild.handle})
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-60"
            >
              {submitting ? "생성 중..." : linkedChild ? "연결하고 시작하기" : "시작하기"}
            </button>
            {!linkedChild && (
              <button
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="text-sm text-text-3"
              >
                나중에 연결할게요
              </button>
            )}
            <button onClick={() => setStep(1)} className="text-sm text-text-3">
              이전으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
