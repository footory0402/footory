"use client";

import { useEffect, useCallback, useState } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { startRenderUpload } from "@/lib/upload-service";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import UploadComplete from "@/components/upload/UploadComplete";
import ChildSelector from "@/components/upload/ChildSelector";
import VideoTrimmer from "@/components/video/VideoTrimmer";
import SpotlightPicker from "@/components/video/SpotlightPicker";
import RenderProgress from "@/components/video/RenderProgress";
import SkillLabelPicker from "@/components/video/SkillLabelPicker";
import EffectsToggle from "@/components/video/EffectsToggle";
import SlowmoPicker from "@/components/video/SlowmoPicker";
import BgmPicker from "@/components/video/BgmPicker";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = [
  { id: 1, label: "구간 자르기" },
  { id: 2, label: "나 찾기" },
  { id: 3, label: "느린 재생" },
  { id: 4, label: "태그" },
  { id: 5, label: "확인" },
];

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfileContext();
  const store = useUploadStore();

  const isParent = profile?.role === "parent";
  const challengeTag = searchParams.get("challenge_tag");

  // Set context + challenge tag on mount
  useEffect(() => {
    if (isParent) {
      store.setContext("parent");
    } else if (challengeTag) {
      store.setContext("challenge");
      store.setChallengeTag(challengeTag);
      if (!store.tags.includes(challengeTag)) {
        store.setTags([challengeTag, ...store.tags].slice(0, 3));
      }
    } else {
      store.setContext("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParent, challengeTag]);

  // Reset on unmount
  useEffect(() => {
    return () => useUploadStore.getState().reset();
  }, []);

  // Step 0: 파일 선택, Step 1-5: 위저드
  const step = store.step;

  // 파일 선택 후 자동으로 Step 1로
  const file = store.file;
  useEffect(() => {
    if (file && step === 0) {
      useUploadStore.getState().setStep(1);
    }
  }, [file, step]);

  const handleNext = useCallback(() => {
    const s = useUploadStore.getState();
    if (s.step < 5) s.setStep(s.step + 1);
  }, []);

  const handleBack = useCallback(() => {
    const s = useUploadStore.getState();
    if (s.step > 1) s.setStep(s.step - 1);
    else if (s.step === 1) {
      s.setStep(0);
      s.setFile(null);
    }
  }, []);

  const handleTrimChange = useCallback((start: number, end: number) => {
    const s = useUploadStore.getState();
    s.setTrimStart(start);
    s.setTrimEnd(end);
  }, []);

  const handleUpload = useCallback(() => {
    startRenderUpload();
  }, []);

  const handleRenderComplete = useCallback((_outputKey: string) => {
    useUploadStore.getState().setStatus("done");
  }, []);

  const handleRenderError = useCallback((error: string) => {
    const s = useUploadStore.getState();
    s.setError(error);
    s.setStatus("error");
  }, []);

  // 완료 화면
  if (store.status === "done") {
    return <UploadComplete />;
  }

  // 렌더링 중 — Realtime 구독으로 진행률 표시
  if (store.status === "rendering") {
    return (
      <RenderProgress
        jobId={store.renderJobId}
        onComplete={handleRenderComplete}
        onError={handleRenderError}
        onRetry={() => {
          store.setStatus("idle");
          store.setError(null);
          store.setProgress(0);
          store.setRenderJobId(null);
          startRenderUpload();
        }}
        onBackToEdit={() => {
          store.setStatus("idle");
          store.setError(null);
          store.setProgress(0);
          store.setRenderJobId(null);
        }}
      />
    );
  }

  // 업로드 중
  if (
    store.status === "uploading_raw" ||
    store.status === "uploading" ||
    store.status === "thumbnail" ||
    store.status === "saving"
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm">
        <div className="flex w-72 flex-col items-center gap-5 rounded-2xl border border-white/[0.06] bg-card p-8">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/10 border-t-accent" />
          <p className="text-[15px] font-semibold text-text-1">
            {store.status === "uploading_raw" || store.status === "uploading"
              ? "영상 업로드 중..."
              : store.status === "thumbnail"
                ? "대표 이미지 만드는 중..."
                : "저장 중..."}
          </p>
          <div className="w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${store.progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[12px] text-text-3">
              {store.progress}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step > 0 ? handleBack() : router.back())}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-text-1">
            {isParent ? "영상 올려주기" : "영상 업로드"}
          </h1>
        </div>

        {/* Step Bar — 파일 선택 후에만 표시 */}
        {step > 0 && (
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    s.id < step
                      ? "bg-[#5A4A2A]"
                      : s.id === step
                        ? "bg-accent"
                        : "bg-[#1E1E22]"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    s.id === step ? "text-accent" : "text-text-3"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Challenge banner */}
        {challengeTag && step === 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-accent/8 px-4 py-3">
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-[13px] font-semibold text-accent">
                챌린지 참여
              </p>
              <p className="text-[12px] text-text-2">
                {challengeTag} 태그가 자동 설정됩니다
              </p>
            </div>
          </div>
        )}

        {/* Parent: child selector */}
        {isParent && step === 0 && <ChildSelector />}

        {/* Step 0: 파일 선택 */}
        {step === 0 && (
          <>
            {!isParent && <UploadUsageGuide isChallenge={!!challengeTag} />}
            <VideoSelector />
          </>
        )}

        {/* Step 1: 트리밍 */}
        {step === 1 && store.file && (
          <div className="animate-fade-up">
            <h2 className="mb-3 text-[15px] font-semibold text-text-1">
              구간 선택
            </h2>
            <VideoTrimmer
              file={store.file}
              trimStart={store.trimStart}
              trimEnd={store.trimEnd}
              onTrimChange={handleTrimChange}
            />
          </div>
        )}

        {/* Step 2: 주인공 표시 */}
        {step === 2 && store.file && (
          <div className="animate-fade-up">
            <h2 className="mb-3 text-[15px] font-semibold text-text-1">
              나 찾기
            </h2>
            <SpotlightPicker
              file={store.file}
              spotlightX={store.spotlightX}
              spotlightY={store.spotlightY}
              onSpotlightChange={(x, y) => store.setSpotlight(x, y)}
            />
          </div>
        )}

        {/* Step 3: 슬로모션 */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 className="mb-3 text-[15px] font-semibold text-text-1">
              느린 재생
            </h2>
            <SlowmoPicker
              trimStart={store.trimStart}
              trimEnd={store.trimEnd ?? 30}
              slowmoStart={store.slowmoStart}
              slowmoEnd={store.slowmoEnd}
              slowmoSpeed={store.slowmoSpeed}
              onSlowmoChange={(start, end, speed) =>
                store.setSlowmo(start, end, speed)
              }
            />
          </div>
        )}

        {/* Step 4: 스킬 라벨 + 태그 + 효과 */}
        {step === 4 && (
          <div className="animate-fade-up flex flex-col gap-6">
            <div>
              <h2 className="mb-3 text-[15px] font-semibold text-text-1">
                스킬 라벨
              </h2>
              <SkillLabelPicker
                selected={store.skillLabels}
                customLabels={store.customLabels}
                onSelectedChange={(labels) => store.setSkillLabels(labels)}
                onCustomChange={(labels) => store.setCustomLabels(labels)}
              />
            </div>

            <div>
              <h2 className="mb-3 text-[15px] font-semibold text-text-1">
                효과 설정
              </h2>
              <EffectsToggle
                effects={store.effects}
                onChange={(partial) => store.setEffects(partial)}
              />
            </div>

            <div>
              <h2 className="mb-3 text-[15px] font-semibold text-text-1">
                BGM
              </h2>
              <BgmPicker
                selectedId={store.bgmId}
                onSelect={(id) => store.setBgmId(id)}
              />
            </div>

            <div>
              <h2 className="mb-3 text-[15px] font-semibold text-text-1">
                태그 & 메모
              </h2>
              <TagMemoForm />
            </div>
          </div>
        )}

        {/* Step 5: 확인 (프리뷰) — placeholder */}
        {step === 5 && (
          <div className="animate-fade-up">
            <h2 className="mb-3 text-[15px] font-semibold text-text-1">
              업로드 확인
            </h2>
            <UploadSummary />
          </div>
        )}

        {/* Error state */}
        {store.status === "error" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-center text-[14px] font-medium text-text-1">
              {getErrorMessage(store.error)}
            </p>
            <p className="text-center text-[12px] text-text-3">
              {getErrorHint(store.error)}
            </p>
            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  store.setStatus("idle");
                  store.setError(null);
                  store.setProgress(0);
                  store.setStep(store.step > 0 ? store.step : 0);
                }}
                className="flex-1 rounded-xl border border-white/[0.08] bg-card py-3 text-[13px] font-semibold text-text-2 active:scale-[0.99]"
              >
                편집으로 돌아가기
              </button>
              <button
                type="button"
                onClick={() => {
                  store.setStatus("idle");
                  store.setError(null);
                  store.setProgress(0);
                }}
                className="flex-1 rounded-xl bg-accent py-3 text-[13px] font-bold text-bg active:scale-[0.99]"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      {step > 0 && store.status !== "error" && (
        <div className="pointer-events-none fixed bottom-[calc(54px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/96 to-transparent" />
          <div className="relative flex gap-3 px-4 pb-3">
            {/* 건너뛰기 (Step 2, 3) */}
            {(step === 2 || step === 3) && (
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto flex-1 rounded-xl border border-white/[0.08] bg-card py-3.5 text-sm font-semibold text-text-2 active:scale-[0.99]"
              >
                건너뛰기
              </button>
            )}

            {/* 다음 / 업로드 */}
            <button
              type="button"
              onClick={step === 5 ? handleUpload : handleNext}
              disabled={step === 0 && !store.file}
              className="pointer-events-auto flex-1 rounded-xl border border-accent/20 bg-accent py-3.5 text-sm font-bold text-bg shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-[transform,background-color] active:scale-[0.99] disabled:border-border disabled:bg-card-alt disabled:text-text-3 disabled:shadow-none"
            >
              {step === 5 ? "업로드" : "다음"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Upload Summary (Step 5) ── */
function UploadSummary() {
  const store = useUploadStore();

  return (
    <div className="flex flex-col gap-3">
      <SummaryRow label="구간" value={`${formatTime(store.trimStart)} ~ ${formatTime(store.trimEnd ?? 0)}`} />
      <SummaryRow
        label="나 찾기"
        value={store.spotlightX !== null ? "설정됨" : "건너뜀"}
      />
      <SummaryRow
        label="느린 재생"
        value={store.slowmoStart !== null ? "설정됨" : "건너뜀"}
      />
      <SummaryRow
        label="태그"
        value={store.tags.length > 0 ? store.tags.join(", ") : "없음"}
      />
      {store.memo && <SummaryRow label="메모" value={store.memo} />}
      <SummaryRow
        label="효과"
        value={Object.entries(store.effects)
          .filter(([, v]) => v)
          .map(([k]) => EFFECT_LABELS[k] ?? k)
          .join(", ") || "없음"}
      />
    </div>
  );
}

const EFFECT_LABELS: Record<string, string> = {
  color: "색보정",
  cinematic: "영화 느낌 바",
  eafc: "선수 카드 효과",
  intro: "인트로",
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-card px-4 py-3">
      <span className="min-w-[52px] text-[13px] text-text-3">{label}</span>
      <span className="text-[13px] text-text-1">{value}</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Error message helpers ── */
function getErrorMessage(error: string | null): string {
  if (!error) return "업로드에 실패했어요.";
  if (error.includes("네트워크") || error.includes("network"))
    return "인터넷 연결이 불안정해요.";
  if (error.includes("Presign") || error.includes("CORS") || error.includes("R2"))
    return "서버 연결에 문제가 있어요.";
  if (error.includes("클립 저장") || error.includes("렌더"))
    return "영상 처리에 실패했어요.";
  return error;
}

function getErrorHint(error: string | null): string {
  if (!error) return "잠시 후 다시 시도해주세요.";
  if (error.includes("네트워크") || error.includes("network"))
    return "Wi-Fi 또는 데이터 연결을 확인해주세요.";
  if (error.includes("CORS") || error.includes("R2"))
    return "관리자에게 문의해주세요.";
  if (error.includes("렌더"))
    return "편집으로 돌아가서 설정을 변경해보세요.";
  return "잠시 후 다시 시도해주세요.";
}

/* ── Upload Usage Guide Banner ── */
const GUIDE_DISMISSED_KEY = "footory_upload_guide_dismissed";

function UploadUsageGuide({ isChallenge }: { isChallenge: boolean }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(GUIDE_DISMISSED_KEY) === "true";
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) {
      localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
    } else {
      localStorage.removeItem(GUIDE_DISMISSED_KEY);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="text-[13px] font-semibold text-text-1">
          영상을 올리면 이런 곳에 쓰여요
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-3 transition-transform ${collapsed ? "" : "rotate-180"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          <GuideItem icon="👤" text="내 프로필 하이라이트에 추가" />
          <GuideItem icon="📰" text="홈 피드에 자동 게시 (팔로워 노출)" />
          <GuideItem icon="🏆" text="이번 주 MVP 투표 후보 등록" />
          {isChallenge && (
            <GuideItem icon="🎯" text="챌린지 순위에도 반영됩니다" />
          )}
        </div>
      )}
    </div>
  );
}

function GuideItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] text-text-2">{text}</span>
    </div>
  );
}
