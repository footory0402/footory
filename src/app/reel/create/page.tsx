"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClipSelector from "@/components/reel/ClipSelector";
import ClipOrderEditor, { type ReelClipItem, type TransitionType } from "@/components/reel/ClipOrderEditor";
import dynamic from "next/dynamic";
import { toast } from "@/components/ui/Toast";
import {
  loadLatestReelProject,
  markVideoProjectOpened,
  markVideoProjectPublished,
  saveVideoProject,
  type ReelHighlightDraftPayload,
} from "@/lib/video-projects";

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
  const [step, setStep] = useState<Exclude<Step, "preview">>("select");
  const [allClips, setAllClips] = useState<ClipItem[]>([]);
  const [loadingClips, setLoadingClips] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<ReelClipItem[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<"draft" | "published">("draft");
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);

  useEffect(() => {
    fetch("/api/clips")
      .then((r) => r.json())
      .then((data) => setAllClips(data.clips ?? []))
      .catch(() => setError("클립을 불러오지 못했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setLoadingClips(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const latest = await loadLatestReelProject();
        if (cancelled) return;
        setHasRecoverableDraft(!!latest?.project);
      } catch {
        if (cancelled) return;
        setHasRecoverableDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    const clipIds = step === "order"
      ? orderItems.map((item) => item.id)
      : selected;

    if (clipIds.length < 2) return;

    const payload: ReelHighlightDraftPayload = {
      title,
      clipIds,
      items: step === "order"
        ? orderItems
        : clipIds.map((id) => {
          const clip = allClips.find((item) => item.id === id);
          return {
            id,
            thumbnail_url: clip?.thumbnail_url ?? null,
            duration_seconds: clip?.duration_seconds ?? null,
            memo: clip?.memo ?? null,
            transition: "cut" as TransitionType,
          };
        }),
    };

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await saveVideoProject<ReelHighlightDraftPayload>({
            projectId,
            kind: "reel_highlight",
            status: "draft",
            title: title || null,
            payload,
          });
          setProjectId(result.project.id);
          setProjectStatus("draft");
          setHasRecoverableDraft(false);
        } catch {
          // silent autosave failure
        }
      })();
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [allClips, orderItems, projectId, selected, step, title]);

  const handleRestoreDraft = async () => {
    try {
      const latest = await loadLatestReelProject();
      if (!latest?.project) return;

      const payload = latest.project.payload;
      setProjectId(latest.project.id);
      setProjectStatus(latest.project.status === "published" ? "published" : "draft");
      setTitle(payload.title);
      setSelected(payload.clipIds);
      setOrderItems(payload.items);
      setStep("order");
      setHasRecoverableDraft(false);
      await markVideoProjectOpened(latest.project.id);
    } catch {
      setError("최근 reel draft를 복구하지 못했어요.");
    }
  };

  const handleSave = async () => {
    if (orderItems.length < 2) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipIds: orderItems.map((i) => i.id),
          title: title || null,
          status: "done",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장 실패");
        return;
      }
      if (projectId) {
        await markVideoProjectPublished({
          projectId,
          highlightId: data.highlight?.id ?? null,
        });
        setProjectStatus("published");
      }
      toast("릴 초안을 저장했어요. 프로필에서 공개할 수 있습니다.", "success");
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
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-[#070709]">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          type="button"
          aria-label={step === "select" ? "프로필로 돌아가기" : "이전 단계로 돌아가기"}
          onClick={() => {
            if (step === "select") {
              router.push("/profile");
              return;
            }
            setStep("select");
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
            {step === "select" ? "클립 선택" : "순서 편집"}
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
            <div className="flex h-full flex-col">
              {hasRecoverableDraft ? (
                <div className="px-4 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleRestoreDraft()}
                    className="mb-3 flex w-full items-start gap-3 rounded-2xl border border-[#d8b36a]/20 bg-[#d8b36a]/10 px-4 py-4 text-left"
                  >
                    <span className="mt-0.5 text-lg">↺</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#f6d69a]">최근 reel draft 이어서 편집</p>
                      <p className="mt-1 text-[12px] leading-5 text-text-2">선택 순서와 제목을 서버 draft에서 복구합니다.</p>
                    </div>
                  </button>
                </div>
              ) : null}
              <ClipSelector
                clips={allClips}
                selected={selected}
                onToggle={toggleSelect}
                maxDuration={MAX_DURATION}
                totalDuration={totalDuration}
                maxClips={MAX_CLIPS}
              />
            </div>
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
        {projectId ? (
          <p className="mb-2 text-[11px] text-text-3">
            {projectStatus === "published" ? "published reel project" : "draft autosave 활성화"}
          </p>
        ) : null}
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
