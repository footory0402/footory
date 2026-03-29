"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import dynamic from "next/dynamic";
import { useBackClose } from "@/hooks/useBackClose";
import ClipActionsSheet from "@/components/player/ClipActionsSheet";

const IntroCard = dynamic(() => import("@/components/video/hud/IntroCard"), { ssr: false });
const HudOverlay = dynamic(() => import("@/components/video/hud/HudOverlay"), { ssr: false });

function getVideoErrorMessage(code: number): { message: string; retryable: boolean } {
  switch (code) {
    case 2: return { message: "네트워크 오류로 영상을 불러올 수 없습니다", retryable: true };
    case 3: return { message: "영상 파일이 손상되어 재생할 수 없습니다", retryable: false };
    case 4: return { message: "지원하지 않는 영상 형식입니다", retryable: true };
    default: return { message: "영상을 불러올 수 없습니다", retryable: true };
  }
}

export interface PlayableClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number;
  // spotlight overlay
  spotlightX?: number | null;
  spotlightY?: number | null;
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
  // css effects
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  } | null;
}

interface ClipPlayerSheetProps {
  clips: PlayableClip[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
  onHighlightEdit?: (clipId: string) => void;
}

export default function ClipPlayerSheet({
  clips: clipsProp,
  initialIndex = 0,
  onClose,
  onDelete,
  onEditTags,
  onShare,
  onHighlightEdit,
}: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localClips, setLocalClips] = useState(clipsProp);
  const [index, setIndex] = useState(initialIndex);
  const clips = localClips;

  const [paused, setPaused] = useState(false);
  const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [playCount, setPlayCount] = useState(0);
  const [showActions, setShowActions] = useState(false);

  // 위아래 스와이프
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null } | null>(null);

  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;
  const effects = clip?.effects;
  const touchHandled = useRef(false);

  // Intro card overlay
  const [showIntro, setShowIntro] = useState(false);
  const [introData, setIntroData] = useState<HudPlayerData | null>(null);
  const introShownRef = useRef<Set<string>>(new Set());
  // 인트로 카드 API 로딩 완료 전까지 영상 재생 차단
  const [introReady, setIntroReady] = useState(false);

  // 뒤로가기로 영상 플레이어 닫기
  useBackClose(true, onClose);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Load intro card data — 영상 재생 전에 완료시켜 race condition 제거
  useEffect(() => {
    let cancelled = false;
    fetch("/api/player-card")
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (cancelled) return;
        if (!res?.card) {
          // 카드 없음 → 클립 프로필 정보로 기본 HUD 데이터 생성 (인트로 카드는 스킵)
          const currentClip = clipsProp[initialIndex];
          if (currentClip?.playerName) {
            const nameParts = currentClip.playerName.split(/\s+/);
            setIntroData({
              firstName: nameParts.length > 1 ? nameParts[0] : "",
              lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : currentClip.playerName,
              number: "",
              position: currentClip.playerPosition || "FW",
              club: currentClip.teamName || "",
              age: "",
              birthDate: currentClip.playerBirthYear ? `${currentClip.playerBirthYear}` : "",
              height: "",
              weight: "",
              foot: "",
              nationality: "KOREA",
              photoUrl: res?.profile?.avatar_url || "",
              mainColor: "#37474F",
              accentColor: "#D4A853",
            });
          }
          setIntroReady(true);
          return;
        }
        const cd = res.card.card_data;
        const data: HudPlayerData = {
          firstName: cd.firstName || "",
          lastName: cd.lastName || "",
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
          accentColor: res.card.accent_color || "#78909C",
        };
        setIntroData(data);

        // 인트로 카드 표시 → 3초 후 영상 재생
        const currentClip = clipsProp[initialIndex];
        if (currentClip && !introShownRef.current.has(currentClip.id)) {
          introShownRef.current.add(currentClip.id);
          setShowIntro(true);
          setTimeout(() => {
            if (!cancelled) {
              setShowIntro(false);
              setIntroReady(true);
              videoRef.current?.play()?.catch(() => {});
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // introReady가 true가 되면 영상 재생 시작 (autoPlay는 마운트 시점만 작동)
  useEffect(() => {
    if (introReady && !showIntro && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [introReady, showIntro]);

  // Reset on clip change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setVideoError(null);
    setRetryCount(0);
    setShowControls(true);
    scheduleHide();

    // Show intro for subsequent clips (introData already loaded)
    if (introData && clip && !introShownRef.current.has(clip.id)) {
      introShownRef.current.add(clip.id);
      setIntroReady(false);
      setShowIntro(true);
      setTimeout(() => {
        setShowIntro(false);
        setIntroReady(true);
        videoRef.current?.play();
      }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setDuration(v.duration || 0);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onPlay = () => { setPaused(false); scheduleHide(); setPlayCount((c) => c + 1); };
    const onPause = () => { setPaused(true); setShowControls(true); };
    const onLoaded = () => setDuration(v.duration || 0);
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
    };
  }, [scheduleHide, index]);

  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); setShowControls(true); scheduleHide(); }
    else { v.pause(); setPaused(true); setShowControls(true); }
  }, [scheduleHide]);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v || !clip || retryCount >= 3) return;
    setRetryCount((c) => c + 1);
    setVideoError(null);
    const sep = clip.videoUrl.includes("?") ? "&" : "?";
    v.src = `${clip.videoUrl}${sep}t=${Date.now()}`;
    v.load();
  }, [retryCount, clip]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) videoRef.current.currentTime = ratio * duration;
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // 위아래 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeStart.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeStart.current.locked = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      } else return;
    }
    if (swipeStart.current.locked === "v") {
      setSwiping(true);
      setSwipeY(dy);
    }
  };
  const handleTouchEnd = () => {
    if (!swipeStart.current) return;
    if (swipeStart.current.locked === "v" && swiping) {
      const elapsed = Date.now() - swipeStart.current.time;
      const velocity = Math.abs(swipeY) / elapsed;
      if (swipeY < -60 || (swipeY < 0 && velocity > 0.3)) {
        // 위로 스와이프 → 다음 클립
        if (hasNext) goToClip(index + 1);
      } else if (swipeY > 60 || (swipeY > 0 && velocity > 0.3)) {
        if (velocity > 0.5 && !hasPrev) {
          // 첫 클립에서 빠르게 아래 → 닫기
          onClose();
        } else if (hasPrev) {
          goToClip(index - 1);
        } else if (velocity > 0.5) {
          onClose();
        }
      }
      setSwipeY(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      handleTap();
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 300);
    }
    swipeStart.current = null;
  };

  const handleDeleteConfirmed = useCallback(async (clipId: string): Promise<boolean> => {
    if (!onDelete) return false;
    const ok = await onDelete(clipId);
    if (ok) {
      setShowActions(false);
      const remaining = localClips.filter((c) => c.id !== clipId);
      if (remaining.length === 0) { onClose(); return true; }
      const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
      setLocalClips(remaining);
      setIndex(nextIndex);
    }
    return ok;
  }, [onDelete, localClips, index, onClose]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!clip?.videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{ animation: "fullscreen-player-in 0.25s ease-out" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 블러 배경 (가로 영상 처리) ── */}
      {clip.thumbnailUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${clip.thumbnailUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) brightness(0.35)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* ── 인트로 카드 오버레이 ── */}
      {showIntro && introData && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black"
          style={{ animation: "fullscreen-player-in 0.5s ease-out" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center p-6">
            {/* 선수 정보 카드 — 모바일 세로 최적화 */}
            <div
              className="flex w-full max-w-[360px] flex-col items-center rounded-2xl p-7"
              style={{
                background: `linear-gradient(135deg, ${introData.mainColor} 0%, #0a0a0a 50%, ${introData.accentColor}44 100%)`,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${introData.accentColor}22`,
              }}
            >
              {/* Number + Position */}
              <div className="flex w-full items-start justify-between">
                <div>
                  <div className="font-[var(--font-stat)] text-[48px] font-black leading-none text-white" style={{ textShadow: `2px 2px 20px ${introData.accentColor}66` }}>
                    {introData.number || "9"}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold uppercase tracking-[3px] text-white/50">
                    {introData.position || "ST"}
                  </div>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${introData.mainColor}, ${introData.accentColor})` }}
                >
                  {introData.club.replace(/\s*U\d+/, "").substring(0, 5)}
                </div>
              </div>

              {/* Photo */}
              <div
                className="mt-4 flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full"
                style={{ border: `2px solid ${introData.accentColor}44`, background: "rgba(255,255,255,0.05)" }}
              >
                {introData.photoUrl && !introData.photoUrl.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={introData.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Name */}
              <div className="mt-4 text-center">
                <div className="text-[32px] font-black text-white">
                  {introData.lastName}{introData.firstName}
                </div>
                <div
                  className="mt-1.5 inline-block rounded px-3 py-1 text-[12px] font-bold text-white"
                  style={{ background: `${introData.accentColor}33` }}
                >
                  {introData.club}
                </div>
              </div>

              {/* Info grid */}
              <div className="mt-4 grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  { label: "생년월일", value: introData.birthDate || "-" },
                  { label: "나이", value: introData.age ? `${introData.age}세` : "-" },
                  { label: "키", value: introData.height ? `${introData.height}cm` : "-" },
                  { label: "몸무게", value: introData.weight ? `${introData.weight}kg` : "-" },
                ].map((item, i) => (
                  <div key={i} className="px-3.5 py-2.5" style={{ background: "rgba(10,10,12,0.85)" }}>
                    <div className="text-[9px] font-semibold uppercase tracking-[1px] text-white/30">{item.label}</div>
                    <div className="mt-0.5 text-[13px] font-bold" style={{ color: introData.accentColor }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 text-[10px] tracking-[3px] text-white/20">FOOTORY.COM</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 영상 ── */}
      {!videoError && (
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.videoUrl}
          playsInline
          preload="auto"
          muted
          loop
          className="absolute inset-0 z-10 h-full w-full"
          style={{
            objectFit: "contain",
            opacity: showIntro ? 0 : 1,
            transition: showIntro ? "none" : "opacity 0.3s ease",
            transform: swiping ? `translateY(${swipeY * 0.2}px)` : undefined,
            filter: effects?.color ? "saturate(1.2) contrast(1.05) brightness(1.02)" : undefined,
          }}
          onClick={(e) => { e.preventDefault(); if (!touchHandled.current) handleTap(); }}
        />
      )}

      {/* ── 스포트라이트 링 — 인트로 카드 끝난 뒤 표시 ── */}
      {clip.playerName && introReady && !showIntro && clip.spotlightX != null && clip.spotlightY != null && (
        <div className="absolute inset-0 z-[45] pointer-events-none">
          <VideoOverlay
            key={`${clip.id}-${playCount}`}
            spotlight={{ x: clip.spotlightX, y: clip.spotlightY }}
            player={{
              name: clip.playerName,
              position: clip.playerPosition,
              birthYear: clip.playerBirthYear,
              teamName: clip.teamName,
            }}
            effects={effects}
            hideNametag={!!introData}
          />
        </div>
      )}

      {/* ── HUD 오버레이 — 방송 스타일 (항상 표시) ── */}
      {introData && introReady && !showIntro && (
        <div className="absolute inset-0 z-[44] pointer-events-none">
          <HudOverlay
            data={introData}
            config={{ ...DEFAULT_HUD_CONFIG, goalCount: 0 }}
          />
        </div>
      )}

      {/* ── 에러 UI ── */}
      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-center text-[13px] text-white/70 px-8">{videoError.message}</p>
          {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
            <button onClick={handleRetry} className="rounded-lg bg-white/10 px-4 py-2 text-[12px] text-white active:bg-white/20">
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* ── 일시정지 오버레이 ── */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* ── 상단 헤더 ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-2"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white active:bg-black/50"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {clips.length > 1 && (
          <span className="ml-3 font-stat text-[12px] text-white/70">{index + 1} / {clips.length}</span>
        )}
      </div>

      {/* ── 우측 액션 버튼 ── */}
      <div
        className="absolute right-4 bottom-32 z-40 flex flex-col items-center gap-5"
        style={{
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {onShare && (
          <button onClick={() => onShare(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-accent/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">공유</span>
          </button>
        )}
        {onHighlightEdit && (
          <button onClick={() => onHighlightEdit(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-accent active:bg-accent/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <span className="text-[10px] text-accent/80">하이라이트</span>
          </button>
        )}
        {onEditTags && (
          <button onClick={() => onEditTags(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">편집</span>
          </button>
        )}
        {(onDelete || onShare || onEditTags || onHighlightEdit) && (
          <button onClick={() => setShowActions(true)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">더보기</span>
          </button>
        )}
      </div>

      {/* ── 하단 정보 + seekbar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,16px)]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* 태그 표시 (선수명은 VideoOverlay 네임태그에서 표시) */}
        {clip.tag && (
          <div className="mb-3 pr-16">
            <p className="text-[12px] text-white/60">{clip.tag}</p>
          </div>
        )}

        {/* Seekbar */}
        <div
          className="relative h-6 flex items-center cursor-pointer mb-1"
          onClick={handleSeek}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => { e.stopPropagation(); handleSeek(e); }}
        >
          <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute h-3 w-3 rounded-full bg-accent"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between font-stat text-[10px] text-white/40">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── 클립 액션 시트 ── */}
      {showActions && clip && (
        <ClipActionsSheet
          clipId={clip.id}
          onClose={() => setShowActions(false)}
          onDelete={handleDeleteConfirmed}
          onShare={onShare}
          onEditTags={onEditTags}
          onHighlightEdit={onHighlightEdit}
        />
      )}

      {/* ── 클립 도트 ── */}
      {clips.length > 1 && clips.length <= 12 && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5"
          style={{ opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}
        >
          {clips.map((_, i) => (
            <button
              key={i}
              onClick={() => goToClip(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? "h-5 w-1.5 bg-accent"
                  : "h-1.5 w-1.5 bg-white/30 active:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
