"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Caption } from "@/stores/upload-store";
import type { HudPlayerData } from "@/components/video/hud/types";
import CaptionOverlay from "@/components/video/CaptionOverlay";

const VideoOverlay = dynamic(() => import("@/components/video/VideoOverlay"), { ssr: false });
const IntroCard = dynamic(() => import("@/components/video/hud/IntroCard"), { ssr: false });

interface ReelClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration_seconds?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  slowmoStart?: number | null;
  slowmoEnd?: number | null;
  slowmoSpeed?: number | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  effects?: {
    captions?: Caption[];
    color?: boolean;
    cinematic?: boolean;
  } | null;
  transition?: "cut" | "fade";
}

interface ReelPreviewPlayerProps {
  clips: ReelClip[];
  onClose: () => void;
}

export default function ReelPreviewPlayer({ clips, onClose }: ReelPreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fading, setFading] = useState(false);

  // Freeze frame
  const [isFreezing, setIsFreezing] = useState(false);
  const freezeFiredRef = useRef<Set<string>>(new Set());
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intro card
  const [introData, setIntroData] = useState<HudPlayerData | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  const clip = clips[index];
  const totalDuration = clips.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const passedDuration = clips.slice(0, index).reduce((s, c) => s + (c.duration_seconds ?? 0), 0);

  // 인트로 카드 로딩 — 마운트 시 1회
  useEffect(() => {
    let cancelled = false;
    fetch("/api/player-card")
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (cancelled) return;
        if (res?.card) {
          const cd = res.card.card_data;
          setIntroData({
            name: cd.name || `${cd.lastName || ""}${cd.firstName || ""}`.trim() || "",
            number: cd.number || "9",
            position: cd.position || "ST",
            club: cd.club === "직접 입력" ? (cd.customClubName || res.card.club_name || "") : (cd.club || ""),
            age: cd.age || "",
            birthDate: cd.birthDate || "",
            height: cd.height || "",
            weight: cd.weight || "",
            foot: cd.foot || "",
            nationality: cd.nationality || "KOREA",
            photoUrl: (cd.photoUrl && !cd.photoUrl.startsWith("blob:")) ? cd.photoUrl : (res.profile?.avatar_url || ""),
            mainColor: res.card.main_color || "#37474F",
            accentColor: res.card.accent_color || "#D4A853",
          });
          // 인트로 카드 3초 표시 후 재생
          setShowIntro(true);
          setTimeout(() => {
            if (!cancelled) {
              setShowIntro(false);
              setIntroReady(true);
              videoRef.current?.play().catch(() => {});
            }
          }, 3000);
        } else {
          setIntroReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setIntroReady(true);
      });
    return () => { cancelled = true; };
  }, []);

  // introReady가 되면 영상 재생
  useEffect(() => {
    if (introReady && !showIntro) {
      videoRef.current?.play().catch(() => {});
    }
  }, [introReady, showIntro]);

  const goNext = useCallback(() => {
    if (index >= clips.length - 1) {
      setIndex(0);
      return;
    }
    const nextClip = clips[index + 1];
    if (clip?.transition === "fade") {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => i + 1);
        setFading(false);
        videoRef.current?.play().catch(() => {});
      }, 500);
    } else {
      setIndex((i) => i + 1);
    }
    if (videoRef.current && nextClip?.slowmoStart == null) {
      videoRef.current.playbackRate = 1;
    }
  }, [index, clips, clip]);

  // 클립 변경 시 비디오 초기화
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip) return;
    setIsFreezing(false);
    if (freezeTimerRef.current) { clearTimeout(freezeTimerRef.current); freezeTimerRef.current = null; }
    v.src = clip.videoUrl;
    v.load();
    const trimS = clip.trimStart ?? 0;
    const onLoaded = () => {
      if (trimS > 0) v.currentTime = trimS;
      if (introReady) v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, clip]);

  // timeupdate 핸들러
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip) return;
    const onTime = () => {
      const trimS = clip.trimStart ?? 0;
      const trimE = clip.trimEnd ?? v.duration ?? 0;
      if (trimE > 0 && v.currentTime >= trimE) {
        goNext();
        return;
      }
      const elapsed = Math.max(0, v.currentTime - trimS);
      setCurrentTime(elapsed);
      if (totalDuration > 0) {
        setTotalProgress((passedDuration + elapsed) / totalDuration);
      }
      // 슬로모
      const sStart = clip.slowmoStart;
      const sEnd = clip.slowmoEnd;
      const sSpeed = clip.slowmoSpeed ?? 0.5;
      if (sStart != null && sEnd != null) {
        const inSlowmo = v.currentTime >= sStart && v.currentTime < sEnd;
        if (inSlowmo && v.playbackRate !== sSpeed) v.playbackRate = sSpeed;
        else if (!inSlowmo && v.playbackRate !== 1) v.playbackRate = 1;
      }
      // freeze frame
      if (
        clip.freezeAt != null &&
        clip.spotlightX != null &&
        !freezeFiredRef.current.has(clip.id) &&
        !v.paused &&
        v.currentTime >= clip.freezeAt
      ) {
        freezeFiredRef.current.add(clip.id);
        v.pause();
        setIsFreezing(true);
        freezeTimerRef.current = setTimeout(() => {
          setIsFreezing(false);
          freezeTimerRef.current = null;
          v.play().catch(() => {});
        }, 1000);
      }
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", () => setPaused(false));
    v.addEventListener("pause", () => setPaused(true));
    return () => {
      v.removeEventListener("timeupdate", onTime);
    };
  }, [index, clip, goNext, passedDuration, totalDuration]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const effects = clip?.effects;
  const captions = effects?.captions ?? [];

  const spotlight =
    clip?.spotlightX != null && clip?.spotlightY != null
      ? { x: clip.spotlightX, y: clip.spotlightY }
      : null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 인트로 카드 오버레이 */}
      {showIntro && introData && (
        <div className="absolute inset-0 z-30">
          <IntroCard data={introData} />
        </div>
      )}

      {/* 닫기 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <span className="text-[11px] font-semibold text-white/70">{index + 1} / {clips.length}</span>
        </div>
      </div>

      {/* 전체 진행 바 */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full" style={{ width: `${totalProgress * 100}%`, background: "#D4A853", transition: "width 0.1s linear" }} />
      </div>

      {/* 비디오 */}
      <div className="relative flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          style={{
            opacity: fading ? 0 : 1,
            transition: fading ? "opacity 0.5s" : "none",
            filter: effects?.color ? "saturate(1.2) contrast(1.05)" : undefined,
          }}
        />

        {/* 스포트라이트 오버레이 */}
        {spotlight && (
          <div className="absolute inset-0 pointer-events-none">
            <VideoOverlay
              spotlight={spotlight}
              player={{ name: "" }}
              effects={effects ?? undefined}
              hideNametag
              freezeMode={isFreezing}
            />
          </div>
        )}

        {/* 캡션 오버레이 */}
        {captions.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <CaptionOverlay captions={captions} currentTime={currentTime} />
          </div>
        )}

        {/* 시네마틱 바 */}
        {effects?.cinematic && (
          <>
            <div className="absolute top-0 left-0 right-0 h-[10%]" style={{ background: "rgba(0,0,0,0.85)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-[10%]" style={{ background: "rgba(0,0,0,0.85)" }} />
          </>
        )}

        {/* 재생/일시정지 탭 */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          {paused && (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
