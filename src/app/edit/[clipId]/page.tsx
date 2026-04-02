"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import IntroCard from "@/components/video/hud/IntroCard";
import PlayerReviewCard from "@/components/video/hud/PlayerReviewCard";
import OutroCard from "@/components/video/hud/OutroCard";
import { DEFAULT_HUD_CONFIG, type HudPlayerData } from "@/components/video/hud/types";

type PreviewSection = "intro" | "review" | "highlight" | "outro";

export default function VideoEditPage() {
  const { clipId } = useParams<{ clipId: string }>();
  const router = useRouter();

  const [playerData, setPlayerData] = useState<HudPlayerData | null>(null);
  const [clipData, setClipData] = useState<{ video_url: string; duration_seconds: number } | null>(null);
  const [activeSection, setActiveSection] = useState<PreviewSection>("intro");
  const [reviewProgress, setReviewProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [done, setDone] = useState(false);

  // Load player card + clip data
  useEffect(() => {
    Promise.all([
      fetch("/api/player-card").then((r) => r.ok ? r.json() : null),
      fetch(`/api/clips/${clipId}`).then((r) => r.ok ? r.json() : null),
    ]).then(([cardRes, clipRes]) => {
      if (cardRes?.card) {
        const cd = cardRes.card.card_data;
        setPlayerData({
          name: cd.name || `${cd.lastName || ""}${cd.firstName || ""}`.trim() || "",
          number: cd.number || "9",
          position: cd.position || "ST",
          club: cd.club === "직접 입력" ? (cd.customClubName || cardRes.card.club_name || "") : (cd.club || ""),
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
      if (clipRes?.clip) {
        setClipData({ video_url: clipRes.clip.video_url, duration_seconds: clipRes.clip.duration_seconds });
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
      const { generateHighlightVideo } = await import("@/lib/highlight-generator");
      await generateHighlightVideo(
        playerData,
        DEFAULT_HUD_CONFIG,
        clipData.video_url,
        (pct) => setGenProgress(pct),
        clipId,
      );
      setDone(true);
    } catch (err) {
      console.error("Generation failed:", err);
      alert("영상 생성에 실패했습니다. PC에서 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  }, [playerData, clipData, clipId]);

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
        <span className="text-3xl">🎴</span>
        <p className="text-[15px] font-semibold text-text-1">선수카드가 필요해요</p>
        <p className="text-[13px] text-text-3">하이라이트 영상을 만들려면 먼저 선수카드를 만들어주세요</p>
        <button
          onClick={() => router.push("/editor")}
          className="mt-2 rounded-xl bg-accent px-6 py-3 text-[14px] font-bold text-black"
        >
          카드 만들러 가기
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0c] px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[17px] font-bold text-text-1">하이라이트 완성!</p>
        <p className="text-[13px] text-text-3">영상이 저장되었습니다</p>
        <button
          onClick={() => router.push("/profile?tab=highlights")}
          className="mt-2 rounded-xl bg-accent px-6 py-3 text-[14px] font-bold text-black"
        >
          프로필에서 확인
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
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-black disabled:opacity-50"
        >
          {generating ? `생성 중 ${genProgress}%` : "영상 생성"}
        </button>
      </header>

      {/* Preview area */}
      <div className="flex flex-1 flex-col px-4 pt-4">
        {/* Card / Video Preview */}
        <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
          {activeSection === "intro" && <IntroCard data={playerData} />}
          {activeSection === "review" && <PlayerReviewCard data={playerData} progress={reviewProgress} />}
          {activeSection === "outro" && <OutroCard accentColor={playerData.accentColor} />}
          {activeSection === "highlight" && clipData && (
            <video
              src={clipData.video_url}
              className="h-full w-full object-contain"
              controls
              playsInline
            />
          )}
        </div>

        {/* Timeline */}
        <div className="mx-auto mt-3 flex w-full max-w-[640px] gap-1">
          {(["intro", "review", "highlight", "outro"] as PreviewSection[]).map((section) => {
            const labels: Record<PreviewSection, string> = {
              intro: "인트로",
              review: "리뷰",
              highlight: "경기영상",
              outro: "아웃트로",
            };
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition-all ${
                  activeSection === section
                    ? "bg-accent text-black"
                    : "bg-[#1a1a1e] text-text-3"
                } ${section === "highlight" ? "flex-1" : ""}`}
              >
                {labels[section]}
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mx-auto mt-4 w-full max-w-[640px] rounded-xl border border-white/[0.06] bg-card p-4">
          <p className="text-[13px] font-semibold text-text-1">완성 영상 구조</p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-text-3">
            <span className="rounded bg-accent/15 px-2 py-0.5 font-semibold text-accent">인트로 5초</span>
            <span className="text-text-3">→</span>
            <span className="rounded bg-accent/15 px-2 py-0.5 font-semibold text-accent">리뷰 5초</span>
            <span className="text-text-3">→</span>
            <span className="flex-1 rounded bg-white/[0.06] px-2 py-0.5 text-center font-semibold text-text-2">경기 영상</span>
            <span className="text-text-3">→</span>
            <span className="rounded bg-accent/15 px-2 py-0.5 font-semibold text-accent">아웃트로 3초</span>
          </div>
        </div>

        {/* Generation progress */}
        {generating && (
          <div className="mx-auto mt-4 w-full max-w-[640px]">
            <div className="overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-2 rounded-full bg-accent transition-all duration-300"
                style={{ width: `${genProgress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-text-3">
              {genProgress < 15 ? "ffmpeg 로딩 중..." :
               genProgress < 35 ? "인트로 카드 생성 중..." :
               genProgress < 55 ? "Player Review 생성 중..." :
               genProgress < 80 ? "영상 인코딩 중..." :
               genProgress < 95 ? "최종 합성 중..." :
               "R2에 업로드 중..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
