"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClipSelector from "@/components/reel/ClipSelector";
import ClipOrderEditor, { type ReelClipItem, type TransitionType } from "@/components/reel/ClipOrderEditor";
import dynamic from "next/dynamic";

const ReelPreviewPlayer = dynamic(() => import("@/components/reel/ReelPreviewPlayer"), { ssr: false });

const MAX_DURATION = 300;
const MAX_CLIPS = 10;

interface ClipItem {
  id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  memo: string | null;
  video_url: string;
  trim_start: number | null;
  trim_end: number | null;
  slowmo_start: number | null;
  slowmo_end: number | null;
  slowmo_speed: number | null;
  effects: Record<string, unknown> | null;
  spotlight_x: number | null;
  spotlight_y: number | null;
  freeze_at: number | null;
}

type Step = "select" | "order" | "preview";

export default function ReelCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [allClips, setAllClips] = useState<ClipItem[]>([]);
  const [loadingClips, setLoadingClips] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<ReelClipItem[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clips")
      .then((r) => r.json())
      .then((data) => setAllClips(data.clips ?? []))
      .catch(() => {})
      .finally(() => setLoadingClips(false));
  }, []);

  const totalDuration = selected.reduce((s, id) => {
    const c = allClips.find((c) => c.id === id);
    return s + (c?.duration_seconds ?? 0);
  }, 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CLIPS) return prev;
      return [...prev, id];
    });
  };

  const goToOrder = () => {
    const items: ReelClipItem[] = selected.map((id) => {
      const c = allClips.find((c) => c.id === id)!;
      return { id, thumbnail_url: c.thumbnail_url, duration_seconds: c.duration_seconds, memo: c.memo, transition: "cut" as TransitionType };
    });
    setOrderItems(items);
    setStep("order");
  };

  const handleSave = async () => {
    if (orderItems.length < 2) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipIds: orderItems.map((i) => i.id), title: title || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장 실패");
        return;
      }
      router.push("/profile");
    } catch {
      setError("저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  // 미리보기용 클립 데이터 매핑
  const previewClips = orderItems.map((item, i) => {
    const c = allClips.find((cl) => cl.id === item.id)!;
    return {
      id: item.id,
      videoUrl: c?.video_url ?? "",
      thumbnailUrl: item.thumbnail_url,
      duration_seconds: item.duration_seconds,
      trimStart: c?.trim_start,
      trimEnd: c?.trim_end,
      slowmoStart: c?.slowmo_start,
      slowmoEnd: c?.slowmo_end,
      slowmoSpeed: c?.slowmo_speed,
      effects: c?.effects as Record<string, unknown> | null,
      spotlightX: c?.spotlight_x,
      spotlightY: c?.spotlight_y,
      freezeAt: c?.freeze_at,
      transition: i < orderItems.length - 1 ? orderItems[i].transition : undefined,
    };
  });

  return (
    <div className="flex flex-col bg-[#070709] min-h-dvh max-w-[430px] mx-auto">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          type="button"
          onClick={() => {
            if (step === "select") router.back();
            else if (step === "order") setStep("select");
            else setStep("order");
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center active:bg-white/10"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-[15px] font-bold text-white">하이라이트 릴</h1>
          <p className="text-[11px] text-text-3">
            {step === "select" ? "클립 선택" : step === "order" ? "순서 편집" : "미리보기"}
          </p>
        </div>
        {/* 단계 표시 */}
        <div className="ml-auto flex items-center gap-1">
          {(["select", "order"] as Step[]).map((s, i) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: step === s ? "20px" : "6px",
                height: "6px",
                background: step === s ? "#D4A853" : (["select", "order"].indexOf(step) > i ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.15)"),
              }}
            />
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {step === "select" && (
          loadingClips ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            </div>
          ) : (
            <ClipSelector
              clips={allClips}
              selected={selected}
              onToggle={toggleSelect}
              maxDuration={MAX_DURATION}
              totalDuration={totalDuration}
            />
          )
        )}

        {step === "order" && (
          <ClipOrderEditor
            items={orderItems}
            onChange={setOrderItems}
            title={title}
            onTitleChange={setTitle}
          />
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mx-4 mb-2 rounded-xl px-3 py-2 text-[12px] text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* 하단 버튼 */}
      <div
        className="shrink-0 px-4 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        {step === "select" && (
          <button
            type="button"
            onClick={goToOrder}
            disabled={selected.length < 2 || totalDuration > MAX_DURATION}
            className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg active:scale-[0.99] disabled:opacity-40"
          >
            다음 — {selected.length}개 선택
          </button>
        )}

        {step === "order" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex-1 rounded-xl py-3.5 text-[14px] font-bold active:scale-[0.99]"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
            >
              미리보기 ▶
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || orderItems.length < 2}
              className="flex-1 rounded-xl bg-accent py-3.5 text-[14px] font-bold text-bg active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>

      {/* 미리보기 플레이어 */}
      {showPreview && (
        <ReelPreviewPlayer
          clips={previewClips}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
