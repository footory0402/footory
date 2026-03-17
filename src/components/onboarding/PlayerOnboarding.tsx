"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { POSITIONS, POSITION_LABELS, HANDLE_REGEX, type PlayStyleType, type StyleTraitKey } from "@/lib/constants";
import PlayStyleTest from "@/components/player/PlayStyleTest";
import { toast } from "sonner";

const DRAFT_KEY = "footory_onboarding_player_draft";

const FOOT_OPTIONS = [
  { value: "right", label: "오른발" },
  { value: "left", label: "왼발" },
  { value: "both", label: "양발" },
] as const;

interface Props {
  onBack: () => void;
}

export default function PlayerOnboarding({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 추가정보, 3: 플레이스타일, 4: 프사
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [position, setPosition] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Step 2
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [preferredFoot, setPreferredFoot] = useState("");

  // Step 3 — play style
  const [playStyleResult, setPlayStyleResult] = useState<{
    styleType: PlayStyleType;
    traits: Record<StyleTraitKey, number>;
    answers: number[];
  } | null>(null);

  // Step 4 — avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage 복원 + OAuth 메타데이터 자동 채우기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.name) setName(d.name);
        if (d.handle) setHandle(d.handle);
        if (d.position) setPosition(d.position);
        if (d.birthYear) setBirthYear(d.birthYear);
        if (d.heightCm) setHeightCm(d.heightCm);
        if (d.weightKg) setWeightKg(d.weightKg);
        if (d.preferredFoot) setPreferredFoot(d.preferredFoot);
        if (d.step && d.step > 1) setStep(d.step);
        return;
      }
    } catch {}

    // OAuth 메타데이터에서 이름/아바타 자동 채우기 (카카오 등)
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const meta = user.user_metadata;
        if (meta?.full_name && !name) setName(meta.full_name);
        else if (meta?.name && !name) setName(meta.name);
        if (meta?.avatar_url && !avatarPreview) {
          setAvatarPreview(meta.avatar_url);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        name, handle, position, birthYear, heightCm, weightKg, preferredFoot, step,
      }));
    } catch {}
  }, [name, handle, position, birthYear, heightCm, weightKg, preferredFoot, step]);

  // Handle check debounce
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
        if (!cancelled) setHandleStatus(data.available ? "available" : "taken");
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

  const canProceedStep1 =
    name.trim().length >= 1 && handleStatus === "available" && position;

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 선택할 수 있어요");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하의 이미지만 업로드할 수 있어요");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    let avatarUrl: string | null = null;

    // Upload avatar if selected
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.url || null;
        }
      } catch {
        // If avatar upload fails, proceed without it
      }
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "player",
          name: name.trim(),
          handle,
          position,
          birth_year: birthYear ? parseInt(birthYear) : null,
          height_cm: heightCm ? parseInt(heightCm) : null,
          weight_kg: weightKg ? parseInt(weightKg) : null,
          preferred_foot: preferredFoot || null,
          avatar_url: avatarUrl,
        }),
      });

      if (res.ok) {
        // Save play style if completed
        if (playStyleResult) {
          try {
            await fetch("/api/play-style", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(playStyleResult),
            });
          } catch {
            // Non-critical — can be retested later
          }
        }
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        localStorage.setItem("footory_show_welcome", "1");
        router.replace("/");
      } else {
        const data = await res.json();
        toast.error(data.error || "프로필 생성에 실패했어요");
        setSubmitting(false);
      }
    } catch {
      toast.error("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, name, handle, position, birthYear, heightCm, weightKg, preferredFoot, avatarFile, playStyleResult, router]);

  return (
    <div className="flex-1">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
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
          <h1 className="text-2xl font-bold text-text-1">기본 정보</h1>
          <p className="mt-2 text-sm text-text-2">선수 프로필을 만들어볼게요</p>

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
                {/* 상태 아이콘 */}
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
              {handleStatus === "idle" && <p className="mt-1 text-xs text-text-3">footory.com/p/<span className="text-text-2">{handle || "my_handle"}</span> 로 공유할 수 있어요</p>}
              {handleStatus === "checking" && <p className="mt-1 text-xs text-text-3">확인 중...</p>}
              {handleStatus === "available" && <p className="mt-1 text-xs text-green">footory.com/p/{handle} 사용 가능!</p>}
              {handleStatus === "taken" && <p className="mt-1 text-xs text-red">이미 사용 중인 주소예요</p>}
              {handleStatus === "invalid" && <p className="mt-1 text-xs text-red">3~20자, 영문 소문자·숫자·_ 만 가능</p>}
            </div>

            {/* Position */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">포지션</label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`rounded-lg border py-3 transition-all ${
                      position === pos
                        ? "border-accent bg-[var(--accent-bg)] text-accent"
                        : "border-border bg-card text-text-2"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold">{pos}</span>
                      <span className={`text-[10px] font-normal ${position === pos ? "text-accent/70" : "text-text-3"}`}>
                        {POSITION_LABELS[pos]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

      {/* Step 2: 추가 정보 (선택) */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-text-1">신체 정보</h1>
          <p className="mt-2 text-sm text-text-2">스카우터가 참고하는 정보예요 (건너뛰기 가능)</p>

          <div className="mt-8 flex flex-col gap-5">
            {/* Height */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">키 (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="170"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                min={100}
                max={220}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">몸무게 (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="65"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                min={20}
                max={150}
              />
            </div>

            {/* Preferred foot */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">주발</label>
              <div className="flex gap-2">
                {FOOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPreferredFoot(opt.value)}
                    className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-all ${
                      preferredFoot === opt.value
                        ? "border-accent bg-[var(--accent-bg)] text-accent"
                        : "border-border bg-card text-text-2"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
              onClick={() => setStep(3)}
              className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity"
            >
              {heightCm || weightKg || preferredFoot ? "다음" : "건너뛰기"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 플레이 스타일 테스트 */}
      {step === 3 && (
        <div className="animate-fade-up flex-1 flex flex-col">
          <h1 className="text-xl font-bold text-text-1 mb-1">너의 플레이 스타일을 찾아보자! ⚡</h1>
          <p className="text-sm text-text-3 mb-6">경기 상황에서 나라면 어떻게 할지 골라봐</p>
          <PlayStyleTest
            onComplete={(result) => {
              setPlayStyleResult(result);
              setStep(4);
            }}
            onSkip={() => setStep(4)}
          />
        </div>
      )}

      {/* Step 4: 프로필 사진 */}
      {step === 4 && (
        <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-border transition-colors hover:border-accent/50"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="프로필 미리보기"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <svg className="h-10 w-10 text-text-3 transition-colors group-hover:text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
            {/* Camera badge */}
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </button>

          <h1 className="text-2xl font-bold text-text-1">프로필 사진</h1>
          <p className="mt-2 text-sm text-text-2">나중에 설정할 수도 있어요</p>
          <p className="mt-1 text-xs text-text-3">JPG, PNG (최대 5MB)</p>

          <div className="mt-10 flex w-full flex-col gap-3">
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-60"
            >
              {submitting ? "프로필 생성 중..." : "시작하기"}
            </button>
            <button onClick={() => setStep(3)} className="text-sm text-text-3">
              이전으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
