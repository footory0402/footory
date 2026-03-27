"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import HudOverlay from "@/components/video/hud/HudOverlay";
import IntroCard from "@/components/video/hud/IntroCard";
import PlayerReviewCard from "@/components/video/hud/PlayerReviewCard";
import OutroCard from "@/components/video/hud/OutroCard";
import { DEFAULT_HUD_CONFIG, type HudPlayerData, type HudConfig } from "@/components/video/hud/types";

type PreviewSection = "intro" | "review" | "highlight" | "outro";

export default function VideoEditPage() {
  const { clipId } = useParams<{ clipId: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playerData, setPlayerData] = useState<HudPlayerData | null>(null);
  const [clipData, setClipData] = useState<{ video_url: string; duration_seconds: number } | null>(null);
  const [hudConfig, setHudConfig] = useState<HudConfig>(DEFAULT_HUD_CONFIG);
  const [activeSection, setActiveSection] = useState<PreviewSection>("intro");
  const [reviewProgress, setReviewProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // Load player card + clip data
  useEffect(() => {
    Promise.all([
      fetch("/api/player-card").then((r) => r.ok ? r.json() : null),
      fetch(`/api/clips`).then((r) => r.ok ? r.json() : null),
    ]).then(([cardRes, clipsRes]) => {
      if (cardRes?.card) {
        const cd = cardRes.card.card_data;
        setPlayerData({
          firstName: cd.firstName || "",
          lastName: cd.lastName || "",
          number: cd.number || "9",
          position: cd.position || "ST",
          club: cd.club || cd.customClubName || cardRes.card.club_name || "",
          age: cd.age || "",
          birthDate: cd.birthDate || "",
          height: cd.height || "",
          weight: cd.weight || "",
          foot: cd.foot || "",
          nationality: cd.nationality || "KOREA",
          photoUrl: cd.photoUrl || cardRes.profile?.avatar_url || "",
          mainColor: cardRes.card.main_color || "#37474F",
          accentColor: cardRes.card.accent_color || "#78909C",
        });
      }
      if (clipsRes?.clips) {
        const clip = clipsRes.clips.find((c: { id: string }) => c.id === clipId);
        if (clip) setClipData({ video_url: clip.video_url, duration_seconds: clip.duration_seconds });
      }
      setLoading(false);
    });
  }, [clipId]);

  // Review card animation
  useEffect(() => {
    if (activeSection !== "review") return;
    setReviewProgress(0);
    const start = Date.now();
    const duration = 3000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setReviewProgress(p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [activeSection]);

  const handleGenerate = useCallback(async () => {
    if (!playerData || !clipData) return;
    setGenerating(true);
    setGenProgress(0);

    try {
      // Dynamic import to keep bundle small
      const { generateHighlightVideo } = await import("@/lib/highlight-generator");
      await generateHighlightVideo(
        playerData,
        hudConfig,
        clipData.video_url,
        (pct) => setGenProgress(pct),
        clipId,
      );
      // Reload clip data to show updated video
      const res = await fetch(`/api/clips/${clipId}`);
      if (res.ok) {
        const { clip } = await res.json();
        if (clip) setClipData({ video_url: clip.video_url, duration_seconds: clip.duration_seconds });
      }
      setActiveSection("highlight");
    } catch (err) {
      console.error("Generation failed:", err);
      alert("영상 생성에 실패했습니다. PC에서 다시 시도해주세요.");
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [playerData, hudConfig, clipData, clipId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0c] px-4 text-center">
        <p className="text-sm text-text-3">먼저 선수카드를 만들어주세요</p>
        <button
          onClick={() => router.push("/editor")}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-black"
        >
          카드 만들러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/6 bg-[#111114] px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-text-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[15px] font-bold text-text-1">하이라이트 편집</h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !clipData}
          className="rounded-lg bg-gradient-to-r from-accent to-[#c49a3d] px-4 py-2 text-[13px] font-bold text-black shadow-lg disabled:opacity-50"
        >
          {generating ? `생성 중 ${genProgress}%` : "영상 생성"}
        </button>
      </header>

      {/* Preview area */}
      <div className="flex flex-1 flex-col">
        {/* Video / Card Preview */}
        <div className="relative mx-auto w-full max-w-[640px] overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
          {activeSection === "intro" && <IntroCard data={playerData} />}
          {activeSection === "review" && <PlayerReviewCard data={playerData} progress={reviewProgress} />}
          {activeSection === "outro" && <OutroCard accentColor={playerData.accentColor} />}
          {activeSection === "highlight" && (
            <>
              {clipData ? (
                <video
                  ref={videoRef}
                  src={clipData.video_url}
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-3">
                  영상을 불러올 수 없습니다
                </div>
              )}
              <HudOverlay data={playerData} config={hudConfig} />
            </>
          )}
        </div>

        {/* Timeline bar */}
        <div className="mx-auto mt-3 flex w-full max-w-[640px] gap-1 px-4">
          {(["intro", "review", "highlight", "outro"] as PreviewSection[]).map((section) => {
            const labels: Record<PreviewSection, string> = {
              intro: "인트로 5초",
              review: "리뷰 5초",
              highlight: "경기 영상",
              outro: "아웃트로 3초",
            };
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-black"
                    : "bg-[#1a1a1e] text-text-3 hover:text-text-1"
                } ${section === "highlight" ? "flex-1" : ""}`}
              >
                {labels[section]}
              </button>
            );
          })}
        </div>

        {/* HUD Config Panel */}
        {activeSection === "highlight" && (
          <div className="mx-auto mt-4 w-full max-w-[640px] px-4">
            <h3 className="mb-3 text-[13px] font-bold text-text-1">HUD 설정</h3>
            <div className="flex flex-col gap-1">
              {[
                { key: "showTopBar" as const, label: "상단 타이틀바" },
                { key: "showMiniCard" as const, label: "좌하단 선수 미니카드" },
                { key: "showInfoBar" as const, label: "하단 정보바" },
                { key: "showGoalCounter" as const, label: "골 카운터" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setHudConfig((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
                >
                  <span className="text-[13px] font-medium text-text-1">{item.label}</span>
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      hudConfig[item.key] ? "bg-accent" : "bg-[#2a2a2e]"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        hudConfig[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              ))}

              {/* Goal count input */}
              {hudConfig.showGoalCounter && (
                <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
                  <span className="flex-1 text-[13px] font-medium text-text-1">골 수</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHudConfig((p) => ({ ...p, goalCount: Math.max(0, p.goalCount - 1) }))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-2 active:bg-white/10"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-[var(--font-stat)] text-[18px] font-bold text-accent">
                      {hudConfig.goalCount}
                    </span>
                    <button
                      onClick={() => setHudConfig((p) => ({ ...p, goalCount: p.goalCount + 1 }))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-2 active:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generation progress */}
        {generating && (
          <div className="mx-auto mt-4 w-full max-w-[640px] px-4">
            <div className="overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-2 rounded-full bg-accent transition-all duration-300"
                style={{ width: `${genProgress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-text-3">
              하이라이트 영상 생성 중... {genProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
