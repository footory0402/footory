"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import CaptionOverlay from "@/components/video/CaptionOverlay";
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
  freezeAt?: number | null;
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
  // trim (런타임 구간 재생)
  trimStart?: number | null;
  trimEnd?: number | null;
  // 슬로모션
  slowmoStart?: number | null;
  slowmoEnd?: number | null;
  slowmoSpeed?: number | null;
  // BGM
  bgmId?: string | null;
  // css effects (captions/bgmVolume/originalVolume도 포함)
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
    captions?: import("@/stores/upload-store").Caption[];
    bgmVolume?: number;
    originalVolume?: number;
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
  const [ended, setEnded] = useState(false);
  const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [playCount, setPlayCount] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // 위아래 스와이프
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null; startPanX: number; startPanY: number } | null>(null);

  // 핀치 줌 (Instagram-style)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ startDist: number; startZoom: number; startPanX: number; startPanY: number; midX: number; midY: number } | null>(null);
  const lastTapRef = useRef(0);

  // 자동 포커스 모드
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isAutoZoomingRef = useRef(false);
  const rafIdRef = useRef(0);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  // View count tracking: 3초 재생 후 1회만 호출
  const viewTrackedRef = useRef<Set<string>>(new Set());
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // 영상 실제 해상도 (letterbox 보정에 사용)
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);

  // Freeze frame state
  const [isFreezing, setIsFreezing] = useState(false);
  const freezeFiredRef = useRef<Set<string>>(new Set());
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BGM audio
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // 닫기 애니메이션
  const [closing, setClosing] = useState(false);
  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 250);
  }, [closing, onClose]);

  // 뒤로가기로 영상 플레이어 닫기
  useBackClose(!closing, handleClose);

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
              name: currentClip.playerName,
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
              setShowControls(false); // HUD가 영상 재생 시작점부터 바로 표시
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

  // introReady가 true가 되면 영상 재생 시작 + spotlight 있으면 자동 포커스
  useEffect(() => {
    if (introReady && !showIntro && videoRef.current) {
      videoRef.current.play().catch(() => {});
      // spotlight가 있는 클립이면 자동 2x 포커스 진입
      const currentClip = clips[index];
      if (
        currentClip?.spotlightX != null &&
        currentClip?.spotlightY != null &&
        zoomRef.current <= 1
      ) {
        setIsFocusMode(true);
        animateZoomTo(currentClip.spotlightX, currentClip.spotlightY, 2, 450);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introReady, showIntro]);

  // Reset on clip change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setEnded(false);
    setVideoError(null);
    setRetryCount(0);
    setShowControls(true);
    setIsFreezing(false);
    setVideoNativeSize(null);
    if (freezeTimerRef.current) { clearTimeout(freezeTimerRef.current); freezeTimerRef.current = null; }
    scheduleHide();

    // Show intro for subsequent clips (introData already loaded)
    if (introData && clip && !introShownRef.current.has(clip.id)) {
      introShownRef.current.add(clip.id);
      setIntroReady(false);
      setShowIntro(true);
      setTimeout(() => {
        setShowIntro(false);
        setIntroReady(true);
        videoRef.current?.play()?.catch(() => {});
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
      const currentClip = clips[index];
      const trimS = currentClip?.trimStart ?? 0;
      const trimE = currentClip?.trimEnd ?? v.duration ?? 0;
      const clipDuration = trimE - trimS;

      // trim 구간 끝 → 정지 (탭하면 처음부터 다시 재생)
      if (trimE > 0 && v.currentTime >= trimE) {
        v.currentTime = trimE;
        v.pause();
        setProgress(1);
        setCurrentTime(trimE - trimS);
        setEnded(true);
        return;
      }

      const elapsed = Math.max(0, v.currentTime - trimS);
      setCurrentTime(elapsed);
      setDuration(clipDuration || 0);
      setProgress(clipDuration > 0 ? elapsed / clipDuration : 0);

      // 슬로모션 구간 playbackRate 제어
      const sStart = currentClip?.slowmoStart;
      const sEnd = currentClip?.slowmoEnd;
      const sSpeed = currentClip?.slowmoSpeed ?? 0.5;
      if (sStart != null && sEnd != null) {
        const inSlowmo = v.currentTime >= sStart && v.currentTime < sEnd;
        if (inSlowmo && v.playbackRate !== sSpeed) v.playbackRate = sSpeed;
        else if (!inSlowmo && v.playbackRate !== 1) v.playbackRate = 1;
      }

      // Freeze frame detection
      if (
        currentClip?.freezeAt != null &&
        currentClip.spotlightX != null &&
        !freezeFiredRef.current.has(currentClip.id) &&
        !v.paused &&
        v.currentTime >= currentClip.freezeAt
      ) {
        freezeFiredRef.current.add(currentClip.id);
        v.pause();
        setIsFreezing(true);
        freezeTimerRef.current = setTimeout(() => {
          setIsFreezing(false);
          freezeTimerRef.current = null;
          v.play().catch(() => {});
        }, 1000);
      }
    };
    const onPlay = () => {
      setPaused(false); setEnded(false); scheduleHide(); setPlayCount((c) => c + 1);
      // BGM 재생 동기화
      if (bgmAudioRef.current) {
        bgmAudioRef.current.play().catch(() => {});
      }
      // View count: 3초 후 API 호출 (클립당 1회)
      const currentClip = clips[index];
      if (currentClip && !viewTrackedRef.current.has(currentClip.id)) {
        if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
        viewTimerRef.current = setTimeout(() => {
          if (!viewTrackedRef.current.has(currentClip.id)) {
            viewTrackedRef.current.add(currentClip.id);
            fetch(`/api/clips/${currentClip.id}/view`, { method: "POST" }).catch(() => {});
          }
        }, 3000);
      }
    };
    const onPause = () => {
      setPaused(true); setShowControls(true);
      // 일시정지 시 타이머 취소 (3초 미달)
      if (viewTimerRef.current) { clearTimeout(viewTimerRef.current); viewTimerRef.current = null; }
      // BGM 일시정지 동기화
      bgmAudioRef.current?.pause();
    };
    const onLoaded = () => {
      const currentClip = clips[index];
      const trimS = currentClip?.trimStart ?? 0;
      const trimE = currentClip?.trimEnd ?? v.duration ?? 0;
      if (trimS > 0) v.currentTime = trimS;
      setDuration((trimE - trimS) || 0);
      if (v.videoWidth && v.videoHeight) {
        setVideoNativeSize({ w: v.videoWidth, h: v.videoHeight });
      }
    };
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    const onEnded = () => {
      setEnded(true);
      setPaused(true);
      setShowControls(true);
      setProgress(1);
      bgmAudioRef.current?.pause();
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      if (viewTimerRef.current) { clearTimeout(viewTimerRef.current); viewTimerRef.current = null; }
    };
  }, [scheduleHide, index]);

  // BGM 로드 및 클립 전환 시 동기화
  useEffect(() => {
    const currentClip = clips[index];
    // 이전 BGM 정리
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.src = "";
      bgmAudioRef.current = null;
    }
    const bgmId = currentClip?.bgmId;
    if (!bgmId) return;
    const bgmVolume = (currentClip?.effects?.bgmVolume ?? 40) / 100;
    const originalVolume = (currentClip?.effects?.originalVolume ?? 100) / 100;
    // 비디오 원본 볼륨 적용
    if (videoRef.current) videoRef.current.volume = originalVolume;
    // BGM URL 가져오기 및 오디오 준비
    fetch(`/api/bgm?id=${bgmId}`)
      .then((r) => r.json())
      .then((data) => {
        const url = data.tracks?.[0]?.url;
        if (!url) return;
        const audio = new Audio(url);
        audio.volume = bgmVolume;
        audio.loop = true;
        bgmAudioRef.current = audio;
        // 영상이 재생 중이면 BGM도 바로 시작
        if (videoRef.current && !videoRef.current.paused) {
          audio.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      bgmAudioRef.current?.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    // 프리즈 중에는 탭 무시
    if (isFreezing) return;
    // 영상 끝난 상태 → 처음부터 다시 재생
    if (ended) {
      const currentClip = clips[index];
      const trimS = currentClip?.trimStart ?? 0;
      v.currentTime = trimS;
      setEnded(false);
      setProgress(0);
      setCurrentTime(0);
      v.play().catch(() => {});
      setPaused(false);
      setShowControls(true);
      scheduleHide();
      return;
    }
    if (v.paused) { v.play().catch(() => {}); setPaused(false); setShowControls(true); scheduleHide(); }
    else { v.pause(); setPaused(true); setShowControls(true); }
  }, [scheduleHide, isFreezing, ended, clips, index]);

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
    if (videoRef.current && duration) {
      const trimS = clip?.trimStart ?? 0;
      videoRef.current.currentTime = trimS + ratio * duration;
    }
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // zoom/pan ref 동기화 (animateZoomTo가 최신 값을 읽을 수 있도록)
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // 줌 리셋 + 자동 포커스 재진입 (클립 변경 시)
  useEffect(() => {
    // 이전 클립의 rAF 취소
    cancelAnimationFrame(rafIdRef.current);
    isAutoZoomingRef.current = false;

    setZoom(1);
    setPan({ x: 0, y: 0 });
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setIsFocusMode(false);
    pinchRef.current = null;

    // 새 클립에 spotlight 있으면 자동 포커스 진입 (인트로 카드 없을 때만)
    const newClip = clips[index];
    if (newClip?.spotlightX != null && newClip?.spotlightY != null) {
      // 인트로 카드가 표시되는 동안은 자동 포커스 지연
      const delay = introData && !introShownRef.current.has(newClip.id) ? 3100 : 600;
      const timer = setTimeout(() => {
        if (newClip.spotlightX != null && newClip.spotlightY != null) {
          setIsFocusMode(true);
          animateZoomTo(newClip.spotlightX, newClip.spotlightY, 2, 450);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const clampPan = useCallback((px: number, py: number, z: number) => {
    const max = ((z - 1) / z) * 50;
    return { x: Math.max(-max, Math.min(max, px)), y: Math.max(-max, Math.min(max, py)) };
  }, []);

  // rAF 기반 줌 애니메이션 (targetX/Y: 0-1 정규화된 영상 내 좌표)
  const animateZoomTo = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,
    durationMs: number,
    onDone?: () => void,
  ) => {
    isAutoZoomingRef.current = true;
    const startZoom = zoomRef.current;
    const startPan = { ...panRef.current };

    // object-fit: contain 적용 시 실제 영상 위치(letterbox 오프셋) 계산
    const v = videoRef.current;
    const W = v?.offsetWidth || 390;
    const H = v?.offsetHeight || 844;
    const vw = v?.videoWidth || 1;
    const vh = v?.videoHeight || 1;
    const videoAspect = vw / vh;
    const elemAspect = W / H;
    let displayW: number, displayH: number;
    if (videoAspect > elemAspect) {
      displayW = W; displayH = W / videoAspect; // 가로 맞춤 (위아래 letterbox)
    } else {
      displayH = H; displayW = H * videoAspect; // 세로 맞춤 (좌우 pillarbox)
    }
    const offsetX = (W - displayW) / 2;
    const offsetY = (H - displayH) / 2;

    // 영상 내 좌표(0~1)를 element 절대 좌표로 변환 후 pan 계산
    const spotElemX = offsetX + targetX * displayW;
    const spotElemY = offsetY + targetY * displayH;
    const rawPanX = (0.5 - spotElemX / W) * 100;
    const rawPanY = (0.5 - spotElemY / H) * 100;

    const maxPan = ((targetZoom - 1) / targetZoom) * 50;
    const targetPanX = Math.max(-maxPan, Math.min(maxPan, rawPanX));
    const targetPanY = Math.max(-maxPan, Math.min(maxPan, rawPanY));
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      if (!isAutoZoomingRef.current) return; // 외부에서 취소됨
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const e = easeOutCubic(t);

      const newZoom = startZoom + (targetZoom - startZoom) * e;
      const newPanX = startPan.x + (targetPanX - startPan.x) * e;
      const newPanY = startPan.y + (targetPanY - startPan.y) * e;

      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });

      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        isAutoZoomingRef.current = false;
        onDone?.();
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const getTouchDist = (e: React.TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  // 위아래 스와이프 + 핀치 줌 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 핀치 줌 시작 — 진행 중인 스와이프 상태 초기화 (레이스 컨디션 방지)
      pinchRef.current = {
        startDist: getTouchDist(e),
        startZoom: zoom,
        startPanX: pan.x,
        startPanY: pan.y,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      swipeStart.current = null;
      setSwiping(false);
      setSwipeY(0);
      return;
    }
    if (e.touches.length !== 1 || isFreezing) return;
    const t = e.touches[0];
    if (zoom > 1) {
      // 줌 상태에서는 패닝 — 시작 시점 pan 좌표를 저장해 드리프트 방지
      swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: "h", startPanX: pan.x, startPanY: pan.y };
    } else {
      swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null, startPanX: 0, startPanY: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 핀치 줌 진행
    if (pinchRef.current && e.touches.length === 2) {
      if (isAutoZoomingRef.current) return; // 자동 줌 중 핀치 차단
      const dist = getTouchDist(e);
      const newZoom = Math.max(1, Math.min(4, pinchRef.current.startZoom * (dist / pinchRef.current.startDist)));
      setZoom(newZoom);
      zoomRef.current = newZoom;
      if (newZoom <= 1) { setPan({ x: 0, y: 0 }); panRef.current = { x: 0, y: 0 }; setIsFocusMode(false); }
      return;
    }
    if (!swipeStart.current) return;

    // 줌 상태에서 1손가락 패닝 — 터치 시작 시점의 pan 기준으로 계산해 드리프트 방지
    if (zoom > 1 && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - swipeStart.current.x;
      const dy = t.clientY - swipeStart.current.y;
      // 데드존: 8px 이상 움직여야 패닝 시작 (탭 시 미세 흔들림 방지)
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      const basePanX = pinchRef.current?.startPanX ?? swipeStart.current.startPanX;
      const basePanY = pinchRef.current?.startPanY ?? swipeStart.current.startPanY;
      const newPan = clampPan(
        basePanX + (dx / window.innerWidth) * 100,
        basePanY + (dy / window.innerHeight) * 100,
        zoom,
      );
      panRef.current = newPan;
      setPan(newPan);
      return;
    }

    // 줌 없을 때 기존 스와이프
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

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 핀치 줌 끝
    if (pinchRef.current && e.touches.length === 0) {
      if (zoom <= 1.05) { setZoom(1); setPan({ x: 0, y: 0 }); }
      pinchRef.current = null;
      return;
    }
    if (!swipeStart.current) return;

    // 줌 상태: 탭/더블탭 처리 — swiping 여부와 관계없이 네비게이션 차단 (레이스 컨디션 방지)
    if (zoom > 1) {
      if (swiping) {
        // animateZoomTo가 스와이프 도중 완료되어 zoom>1이 된 경우 — 스와이프 상태만 초기화
        setSwipeY(0);
        setSwiping(false);
      } else {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
          handleTap();
        }
      }
      swipeStart.current = null;
      return;
    }

    if (swipeStart.current.locked === "v" && swiping) {
      const elapsed = Date.now() - swipeStart.current.time;
      const velocity = Math.abs(swipeY) / elapsed;
      if (swipeY < -60 || (swipeY < 0 && velocity > 0.3)) {
        if (hasNext) goToClip(index + 1);
      } else if (swipeY > 60 || (swipeY > 0 && velocity > 0.3)) {
        if (velocity > 0.5 && !hasPrev) {
          handleClose();
        } else if (hasPrev) {
          goToClip(index - 1);
        } else if (velocity > 0.5) {
          handleClose();
        }
      }
      setSwipeY(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      // 더블탭: spotlight 있으면 선수 위치 기준, 없으면 1x ↔ 2x 토글
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        const currentClip = clips[index];
        if (zoomRef.current > 1) {
          // 현재 줌 상태 → 1x로 리셋
          animateZoomTo(0.5, 0.5, 1, 350);
          setIsFocusMode(false);
        } else if (currentClip?.spotlightX != null && currentClip?.spotlightY != null) {
          // spotlight 있음 → 선수 위치로 2x 줌
          animateZoomTo(currentClip.spotlightX, currentClip.spotlightY, 2, 350);
          setIsFocusMode(true);
        } else {
          // spotlight 없음 → 그냥 2x
          animateZoomTo(0.5, 0.5, 2, 350);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        handleTap();
      }
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
      if (remaining.length === 0) { handleClose(); return true; }
      const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
      setLocalClips(remaining);
      setIndex(nextIndex);
    }
    return ok;
  }, [onDelete, localClips, index, onClose]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!clip?.videoUrl) return null;

  // letterbox 보정: spotlight 좌표를 영상 프레임 기준 → element 전체 기준으로 변환
  const adjustedSpot = (() => {
    if (clip.spotlightX == null || clip.spotlightY == null) return null;
    if (!videoNativeSize) return { x: clip.spotlightX, y: clip.spotlightY };
    const v = videoRef.current;
    const W = v?.offsetWidth ?? window.innerWidth;
    const H = v?.offsetHeight ?? window.innerHeight;
    const aspect = videoNativeSize.w / videoNativeSize.h;
    const elemAspect = W / H;
    const displayW = aspect > elemAspect ? W : H * aspect;
    const displayH = aspect > elemAspect ? W / aspect : H;
    const ox = (W - displayW) / 2;
    const oy = (H - displayH) / 2;
    return {
      x: (ox + clip.spotlightX * displayW) / W,
      y: (oy + clip.spotlightY * displayH) / H,
    };
  })();

  // 스와이프 다운 닫기 판정 (첫 클립에서 아래로 스와이프)
  const isDismissSwipe = swiping && swipeY > 0 && !hasPrev;
  const dismissProgress = isDismissSwipe ? Math.min(swipeY / 300, 1) : 0;

  // HUD 하단 고정 바 높이 (골드라인 2px + 1행 ~62px + 2행 ~39px = ~103px, 여유분 포함)
  const HUD_BAR_HEIGHT = 112;
  // seekbar + 시간 표시 높이 (h-11=44px + 시간22px + 패딩약9px)
  const SEEKBAR_HEIGHT = 75;
  const hasHud = !!introData && introReady && !showIntro;

  // 영상과 동일한 transform (zoom/pan/swipe) - overlay가 영상 위치를 따라가도록
  const videoTransform = zoom > 1
    ? `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`
    : (swiping && !isDismissSwipe)
      ? `translateY(${swipeY * 0.35}px) scale(${1 - Math.min(Math.abs(swipeY) / 800, 0.03)})`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      style={{
        touchAction: "none",
        animation: !swiping
          ? closing
            ? "fullscreen-player-out 0.25s ease-in forwards"
            : "fullscreen-player-in 0.25s ease-out"
          : "none",
        transform: isDismissSwipe
          ? `translateY(${swipeY}px) scale(${1 - dismissProgress * 0.08})`
          : undefined,
        opacity: isDismissSwipe ? 1 - dismissProgress * 0.3 : undefined,
        borderRadius: isDismissSwipe ? `${dismissProgress * 16}px` : undefined,
        transition: !swiping
          ? "transform 0.3s ease-out, opacity 0.3s ease-out, border-radius 0.3s ease-out"
          : "none",
      }}
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
          style={{ animation: "fullscreen-player-fade-in 0.5s ease-out" }}
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
                  {introData.name}
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
          muted={isMuted}
          controlsList="nofullscreen nodownload nopictureinpicture"
          disablePictureInPicture
          poster={clip.thumbnailUrl || undefined}
          className="absolute inset-x-0 top-0 z-10 w-full"
          style={{
            height: hasHud ? `calc(100% - env(safe-area-inset-bottom, 16px) - ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT}px)` : "100%",
            objectFit: "contain",
            opacity: (!introReady || showIntro) ? 0 : 1,
            transition: zoom === 1 ? "opacity 0.3s ease, transform 0.2s ease-out" : "opacity 0.3s ease",
            transform: zoom > 1
              ? `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`
              : swiping ? `translateY(${swipeY * 0.2}px)` : undefined,
            transformOrigin: "center center",
            filter: effects?.color ? "saturate(1.2) contrast(1.05) brightness(1.02)" : undefined,
          }}
          onClick={(e) => { e.preventDefault(); if (!touchHandled.current) handleTap(); }}
        />
      )}

      {/* ── 축구 중계 스타일 마커 오버레이 ── */}
      {clip.playerName && introReady && !showIntro && adjustedSpot && (
        <div
          className="absolute inset-x-0 top-0 z-[45] pointer-events-none"
          style={{
            height: hasHud ? `calc(100% - env(safe-area-inset-bottom, 16px) - ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT}px)` : "100%",
            transform: videoTransform,
            transformOrigin: "center center",
          }}
        >
          <VideoOverlay
            key={clip.id}
            spotlight={adjustedSpot}
            player={{
              name: clip.playerName,
              position: clip.playerPosition,
              birthYear: clip.playerBirthYear,
              teamName: clip.teamName,
            }}
            effects={effects}
            hideNametag={!!introData}
            freezeMode={isFreezing}
            zoomLevel={zoom}
          />
        </div>
      )}

      {/* ── 캡션 오버레이 ── */}
      {effects?.captions && effects.captions.length > 0 && introReady && !showIntro && (
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
          height: hasHud ? `calc(100% - env(safe-area-inset-bottom, 16px) - ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT}px)` : "100%",
          zIndex: 46,
        }}>
          <CaptionOverlay
            captions={effects.captions}
            currentTime={currentTime}
          />
        </div>
      )}

      {/* ── HUD 하단 고정 바 — seekbar 위에 위치 (영상→선수정보→시간 순서) ── */}
      {hasHud && (
        <div
          className="absolute inset-x-0 z-[44] pointer-events-none"
          style={{ bottom: `calc(env(safe-area-inset-bottom, 16px) + ${SEEKBAR_HEIGHT}px)` }}
        >
          <HudOverlay
            data={introData!}
            config={{ ...DEFAULT_HUD_CONFIG, goalCount: 0 }}
            mode="docked"
          />
        </div>
      )}

      {/* ── HUD 상단 브랜드 바 — 컨트롤 숨겨질 때만 ── */}
      {hasHud && (
        <div
          className="absolute inset-0 z-[44] pointer-events-none"
          style={{ opacity: !showControls ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <div
            className="absolute inset-x-0 flex items-center justify-center py-2"
            style={{
              top: "calc(env(safe-area-inset-top, 16px) + 44px)",
              background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          >
            <span
              className="text-[12px] font-bold tracking-[5px] text-white/80"
              style={{ fontFamily: "var(--font-brand, 'Rajdhani', sans-serif)" }}
            >
              FOOTORY
            </span>
            <span className="ml-2 text-[9px] tracking-[2px] text-white/30">
              HIGHLIGHT
            </span>
          </div>
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

      {/* ── 줌 인디케이터 — 좌측 상단 (닫기 버튼 아래) ── */}
      {zoom > 1 && (
        <div
          className="absolute z-50 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white/70 backdrop-blur-sm"
          style={{ top: "calc(env(safe-area-inset-top, 16px) + 60px)", left: "16px" }}
        >
          {zoom.toFixed(1)}x
        </div>
      )}

      {/* ── 일시정지/재시작 오버레이 (프리즈 중에는 숨김) ── */}
      {paused && !isFreezing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/10">
            {ended ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
        </div>
      )}

      {/* ── 버퍼링 스피너 ── */}
      {isBuffering && !paused && !isFreezing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-[3px] border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

      {/* ── 상단 헤더 — 뒤로가기는 항상 표시 ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-2"
        style={{
          background: showControls ? "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" : "none",
          transition: "background 0.3s",
        }}
      >
        <button
          onClick={handleClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-black/70 active:scale-95 transition-transform"
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label="닫기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {clips.length > 1 && (
          <span className="ml-3 font-stat text-[12px] text-white/70" style={{ opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>{index + 1} / {clips.length}</span>
        )}

      </div>

      {/* ── 우측 액션 버튼 — 항상 표시 (TikTok/Reels 스타일) ── */}
      <div className="absolute right-4 z-40 flex flex-col items-center gap-5" style={{
        bottom: hasHud ? `calc(env(safe-area-inset-bottom, 16px) + ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT + 24}px)` : "128px",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: showControls ? "auto" : "none",
      }}>
        {/* 선수 포커스 토글 (spotlight 있는 클립만) */}
        {clip.spotlightX != null && clip.spotlightY != null && introReady && (
          <button
            onClick={() => {
              if (isFocusMode || zoom > 1) {
                animateZoomTo(0.5, 0.5, 1, 400);
                setIsFocusMode(false);
              } else {
                animateZoomTo(clip.spotlightX!, clip.spotlightY!, 2, 400);
                setIsFocusMode(true);
              }
            }}
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm text-white"
              style={{
                background: isFocusMode || zoom > 1 ? "rgba(212,168,83,0.3)" : "rgba(0,0,0,0.40)",
                border: isFocusMode || zoom > 1 ? "1px solid rgba(212,168,83,0.5)" : "1px solid transparent",
              }}
            >
              {isFocusMode || zoom > 1 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <span className="text-[10px]" style={{ color: isFocusMode || zoom > 1 ? "#D4A853" : "rgba(255,255,255,0.6)" }}>
              {isFocusMode || zoom > 1 ? "전체" : "선수"}
            </span>
          </button>
        )}
        {/* 소리 토글 */}
        <button
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
              </svg>
            )}
          </div>
          <span className="text-[10px] text-white/60">{isMuted ? "음소거" : "소리"}</span>
        </button>
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

      {/* ── 하단 정보 + seekbar — 항상 맨 아래 (HUD 없을 때는 화면 최하단) ── */}
      <div
        className="absolute left-0 right-0 z-[45] px-4"
        style={{
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          background: hasHud
            ? "linear-gradient(to top, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.6) 60%, transparent 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
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

        {/* Seekbar — 터치 영역 44px, thumb 16px */}
        <div
          className="relative h-11 flex items-center cursor-pointer mb-0.5"
          onClick={handleSeek}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => { e.stopPropagation(); handleSeek(e); }}
        >
          <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute h-4 w-4 rounded-full bg-accent shadow-[0_0_6px_rgba(212,168,83,0.4)]"
            style={{ left: `calc(${progress * 100}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between font-stat text-[13px] text-white/60 pb-1">
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
