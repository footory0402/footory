"use client";

import { useState, useEffect, useCallback } from "react";
import ClipSelector from "./ClipSelector";
import ReelTimeline from "./ReelTimeline";
import { useRouter } from "next/navigation";

interface Clip {
  id: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  renderedUrl: string | null;
}

export default function HighlightBuilder() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<"select" | "order" | "confirm">("select");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 내 렌더된 클립 목록 로드
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clips");
        if (res.ok) {
          const data = await res.json();
          setClips(
            (data.clips ?? [])
              .filter((c: { rendered_url?: string; highlight_status?: string }) =>
                c.rendered_url || c.highlight_status === "done"
              )
              .map((c: { id: string; thumbnail_url: string | null; duration_seconds: number | null; rendered_url: string | null }) => ({
                id: c.id,
                thumbnailUrl: c.thumbnail_url,
                durationSeconds: c.duration_seconds,
                renderedUrl: c.rendered_url,
              }))
          );
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedClips = selectedIds
    .map((id) => clips.find((c) => c.id === id))
    .filter(Boolean) as Clip[];

  const handleCreate = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipIds: selectedIds,
          title: title || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "릴 생성 실패");
      }

      router.replace("/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }, [selectedIds, title, router]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "order") setStep("select");
            else if (step === "confirm") setStep("order");
            else router.back();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
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
          하이라이트 만들기
        </h1>
      </div>

      {/* Step 1: 클립 선택 */}
      {step === "select" && (
        <>
          <h2 className="text-[15px] font-semibold text-text-1">
            클립 선택 (2~10개)
          </h2>
          <ClipSelector
            clips={clips}
            selected={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </>
      )}

      {/* Step 2: 순서 편집 */}
      {step === "order" && (
        <>
          <h2 className="text-[15px] font-semibold text-text-1">
            순서 편집
          </h2>
          <ReelTimeline
            clips={selectedClips}
            onReorder={setSelectedIds}
          />
          <div>
            <label className="mb-1 block text-[12px] text-text-3">
              릴 제목 (선택)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 30))}
              placeholder="예: 3월 베스트 플레이"
              className="w-full rounded-xl border border-white/[0.08] bg-card px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/30"
            />
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-400/10 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Bottom button */}
      <div className="pointer-events-none fixed bottom-[calc(54px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/96 to-transparent" />
        <div className="relative px-4 pb-3">
          <button
            type="button"
            disabled={
              (step === "select" && selectedIds.length < 2) || submitting
            }
            onClick={() => {
              if (step === "select") setStep("order");
              else if (step === "order") handleCreate();
            }}
            className="pointer-events-auto w-full rounded-xl border border-accent/20 bg-accent py-3.5 text-sm font-bold text-bg shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-[transform,background-color] active:scale-[0.99] disabled:border-border disabled:bg-card-alt disabled:text-text-3 disabled:shadow-none"
          >
            {submitting
              ? "생성 중..."
              : step === "select"
                ? `다음 (${selectedIds.length}개 선택)`
                : "릴 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
