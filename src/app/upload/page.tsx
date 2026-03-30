"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { startUpload } from "@/lib/upload-service";
import { startR2BackgroundUpload } from "@/lib/upload-service";
import { isCompressionSupported, loadFFmpeg, compressVideo } from "@/lib/video-compressor";
import EffectsToggle from "@/components/video/EffectsToggle";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DURATION = 300; // 5분

export default function UploadPage() {
  const router = useRouter();
  const { profile, loading } = useProfileContext();
  const store = useUploadStore();
  const effects = useUploadStore((s) => s.effects);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = profile?.role ?? null;
  const canUpload = role === "player" || role === "parent";

  // Preview
  const [preview, setPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Trim
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);

  // Spotlight
  const [frameUrl, setFrameUrl] = useState("");
  const spotlightX = useUploadStore((s) => s.spotlightX);
  const spotlightY = useUploadStore((s) => s.spotlightY);

  // (showOptions removed — 꾸미기 옵션 항상 노출)

  // Reset stale states on mount
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) s.reset();
  }, []);

  // 업로드 완료 시 딜라이트 화면 표시 (자동 이동 제거 → 사용자가 버튼으로 이동)
  const [showDone, setShowDone] = useState(false);
  useEffect(() => {
    if (store.status === "done") setShowDone(true);
  }, [store.status]);

  // Reset context on mount
  useEffect(() => {
    if (!canUpload) return;
    useUploadStore.getState().setContext("general");
  }, [canUpload]);

  // 파일 선택 → 뒤로가기 핸들링
  useEffect(() => {
    if (!store.file) return;
    history.pushState({ uploadFile: true }, "");
    const onPop = () => {
      if (useUploadStore.getState().file) {
        handleClear();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!store.file]);

  // 파일 선택 시 비디오 URL 생성 + 프레임 캡처
  useEffect(() => {
    if (!store.file) return;
    const url = URL.createObjectURL(store.file);
    setVideoUrl(url);

    // 스포트라이트용 프레임 캡처 (별도 비디오 엘리먼트)
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.src = url;

    tempVideo.onloadedmetadata = () => {
      setDuration(Math.round(tempVideo.duration));
      setTrimEnd(Math.round(tempVideo.duration));
      useUploadStore.getState().setDuration(Math.round(tempVideo.duration));
      tempVideo.currentTime = Math.min(2, tempVideo.duration * 0.3);
    };

    tempVideo.onseeked = () => {
      const canvas = document.createElement("canvas");
      const maxW = 640;
      const ratio = tempVideo.videoWidth / tempVideo.videoHeight || 16 / 9;
      canvas.width = maxW;
      canvas.height = Math.round(maxW / ratio);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL("image/jpeg", 0.8));
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.7));
      }
    };

    tempVideo.onerror = () => {};
    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
    };
  }, [store.file]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setPreview(null);
    setDuration(0);

    const isVideo =
      selected.type.startsWith("video/") ||
      selected.type === "application/octet-stream" ||
      selected.type === "" ||
      /\.(mp4|mov|m4v|webm|avi)$/i.test(selected.name);
    if (!isVideo) {
      setError("영상 파일이 아닌 것 같아요. MP4 또는 MOV 파일을 선택해주세요.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      const sizeMB = (selected.size / 1024 / 1024).toFixed(0);
      setError(`영상이 ${sizeMB}MB예요. 200MB 이내로 선택해주세요.`);
      return;
    }

    const dur = await getVideoDuration(selected);
    if (dur > MAX_DURATION) {
      setError(`영상이 ${Math.floor(dur / 60)}분이에요. 5분 이내로 선택해주세요.`);
      return;
    }

    useUploadStore.getState().setFile(selected);
    useUploadStore.getState().setDuration(Math.round(dur));

    // 백그라운드 압축 + 업로드
    // 인트로 카드 ON이면 합성 후 파일이 바뀌므로 백그라운드 업로드 스킵 (낭비 방지)
    const introOn = useUploadStore.getState().effects.intro;

    if (!isCompressionSupported() || selected.size < 5 * 1024 * 1024) {
      useUploadStore.getState().setCompressStatus("skipped");
      if (!introOn) startR2BackgroundUpload();
    } else {
      const s = useUploadStore.getState();
      s.setCompressStatus("loading");
      s.setCompressProgress(0);
      s.setCompressStats(selected.size, null);
      (async () => {
        try {
          await loadFFmpeg((ratio) => {
            useUploadStore.getState().setCompressProgress(Math.round(ratio * 10));
          });
          useUploadStore.getState().setCompressStatus("compressing");
          const result = await compressVideo(selected, {
            onProgress: (pct) => {
              useUploadStore.getState().setCompressProgress(10 + Math.round(pct * 0.9));
            },
          });
          const s2 = useUploadStore.getState();
          s2.setCompressedFile(result.file);
          s2.setCompressStats(result.originalSize, result.compressedSize);
          s2.setCompressStatus("done");
          s2.setCompressProgress(100);
          if (!useUploadStore.getState().effects.intro) startR2BackgroundUpload();
        } catch {
          useUploadStore.getState().setCompressStatus("error");
          if (!useUploadStore.getState().effects.intro) startR2BackgroundUpload();
        }
      })();
    }
  };

  const handleClear = () => {
    useUploadStore.getState().setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setPreview(null);
    setDuration(0);
    setError(null);
    setTrimStart(0);
    setTrimEnd(0);
    setDraggingHandle(null);
    setFrameUrl("");
    if (inputRef.current) inputRef.current.value = "";
    const s = useUploadStore.getState();
    s.setCompressStatus("idle");
    s.setCompressProgress(0);
    s.setCompressedFile(null);
    s.setCompressStats(null, null);
    s.setSpotlight(null, null);
    s.setFreezeAt(null);
  };

  const handleSpotlightTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const store = useUploadStore.getState();
    store.setSpotlight(
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y))
    );
    // 스포트라이트 설정 시 프리즈 시점 자동 설정 (트림 시작 + 1초, 또는 영상 30% 시점)
    if (store.freezeAt === null) {
      const freezeTime = duration > 0
        ? Math.min(trimStart + 1, trimEnd - 0.5)
        : 1;
      store.setFreezeAt(Math.max(0, freezeTime));
    }
  };

  const handleTrimDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, type: "start" | "end") => {
    const bar = trimBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = Math.round(ratio * duration);
    let seekTime: number;
    if (type === "start") {
      const clamped = Math.min(time, trimEnd - 1);
      setTrimStart(clamped);
      useUploadStore.getState().setTrimStart(clamped);
      seekTime = clamped;
    } else {
      const clamped = Math.max(time, trimStart + 1);
      setTrimEnd(clamped);
      useUploadStore.getState().setTrimEnd(clamped);
      seekTime = clamped;
    }
    // 비디오를 해당 시점으로 seek
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const trimmedDuration = trimEnd - trimStart;

  const isUploading = store.status !== "idle" && store.status !== "error";

  /* ── Guard: 로딩 중 ── */
  if (loading && !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-text-3">로딩 중...</p>
      </div>
    );
  }

  /* ── Guard: 권한 없음 ── */
  if (role && !canUpload) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-28">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-card px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-alt text-2xl">
            🚫
          </div>
          <h1 className="text-base font-semibold text-text-1">업로드 권한이 없어요</h1>
          <p className="text-sm text-text-3">선수 또는 부모 계정에서만 사용할 수 있어요.</p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg active:scale-[0.99]"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-28">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => {
            if (store.file) handleClear();
            else router.back();
          }}
          aria-label="뒤로가기"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">영상 올리기</h1>
      </div>

      {/* ── Step 1: 영상 선택 (파일 없음) ── */}
      {!store.file && (
        <div className="px-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-white/10 bg-card py-16 transition-colors active:border-accent/40"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[15px] font-semibold text-text-1">영상을 선택하세요</span>
              <span className="text-[12px] text-text-3">5분 이내 · 200MB 이내</span>
            </div>
          </button>

          {/* 프로필 카드 배너 */}
          <Link
            href="/editor"
            className="mt-4 flex items-center gap-3 rounded-xl border border-accent/15 bg-accent/8 px-4 py-3 transition-colors active:bg-accent/12"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-base">🎴</span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-accent">선수 프로필 카드 만들기</p>
              <p className="text-[10px] text-text-3">영상 인트로에 넣을 선수 카드를 제작하세요</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {error && (
            <div className="mt-3 rounded-xl bg-[#2a1f1f] px-4 py-3 ring-1 ring-[#ff6b6b]/20">
              <p className="text-[13px] leading-relaxed text-[#ff8a8a] whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: 미리보기 + 꾸미기 ── */}
      {store.file && (preview || videoUrl) && (
        <div className="flex flex-col gap-0 animate-fade-up">
          {/* 영상 미리보기 (비디오 플레이어) */}
          <div className="relative bg-black">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                muted
                playsInline
                preload="auto"
                className="w-full h-auto block"
                style={{ maxHeight: "40vh", objectFit: "contain" }}
              />
            ) : (
              <img
                src={preview!}
                alt="미리보기"
                className="w-full h-auto block"
                style={{ maxHeight: "40vh", objectFit: "contain" }}
              />
            )}
            {/* 파일 정보 오버레이 */}
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-stat text-text-1">
                {fmt(duration)}
              </span>
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-stat text-text-1">
                {(store.file.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
            {/* 다른 영상 선택 */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute top-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-white/70 active:bg-black/80"
            >
              변경
            </button>
          </div>

          {/* 트림 바 (2초 이상 영상만) */}
          {duration > 2 && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-text-2">구간 선택</span>
                <span className="text-[11px] font-stat text-accent">
                  {fmt(trimmedDuration)} 선택됨
                </span>
              </div>

              {/* 시작/끝 시간 표시 */}
              <div className="flex items-center justify-center gap-3 mb-3 rounded-xl bg-card px-4 py-2.5">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-3">시작</span>
                  <span className={`text-[16px] font-stat tabular-nums ${draggingHandle === "start" ? "text-accent" : "text-text-1"}`}>
                    {fmt(trimStart)}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-3">끝</span>
                  <span className={`text-[16px] font-stat tabular-nums ${draggingHandle === "end" ? "text-accent" : "text-text-1"}`}>
                    {fmt(trimEnd)}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/[0.08]" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-3">길이</span>
                  <span className="text-[16px] font-stat tabular-nums text-accent">
                    {fmt(trimmedDuration)}
                  </span>
                </div>
              </div>

              <div
                ref={trimBarRef}
                className="relative h-10 rounded-lg bg-white/[0.04] overflow-hidden cursor-pointer"
                onMouseDown={(e) => {
                  const rect = trimBarRef.current!.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width;
                  const time = x * duration;
                  const distStart = Math.abs(time - trimStart);
                  const distEnd = Math.abs(time - trimEnd);
                  const type = distStart < distEnd ? "start" : "end";
                  setDraggingHandle(type);
                  handleTrimDrag(e, type);

                  const onMove = (ev: MouseEvent) => handleTrimDrag(ev as unknown as React.MouseEvent<HTMLDivElement>, type);
                  const onUp = () => { setDraggingHandle(null); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
                  document.addEventListener("mousemove", onMove);
                  document.addEventListener("mouseup", onUp);
                }}
                onTouchStart={(e) => {
                  const rect = trimBarRef.current!.getBoundingClientRect();
                  const x = (e.touches[0].clientX - rect.left) / rect.width;
                  const time = x * duration;
                  const distStart = Math.abs(time - trimStart);
                  const distEnd = Math.abs(time - trimEnd);
                  const type = distStart < distEnd ? "start" : "end";
                  setDraggingHandle(type);
                  handleTrimDrag(e, type);

                  const onMove = (ev: TouchEvent) => handleTrimDrag(ev as unknown as React.TouchEvent<HTMLDivElement>, type);
                  const onUp = () => { setDraggingHandle(null); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onUp); };
                  document.addEventListener("touchmove", onMove);
                  document.addEventListener("touchend", onUp);
                }}
              >
                {/* 선택 구간 */}
                <div
                  className="absolute inset-y-0 bg-accent/20"
                  style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((trimEnd - trimStart) / duration) * 100}%`,
                  }}
                />
                {/* 시작 핸들 — 터치 영역 44×44px, 시각적 핸들은 내부 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `calc(${(trimStart / duration) * 100}% - 22px)`, width: 44, height: 44 }}
                >
                  <div className={`w-4 h-7 rounded-sm flex items-center justify-center ${draggingHandle === "start" ? "bg-accent" : "bg-accent/80"}`}>
                    <div className="w-0.5 h-3 bg-bg rounded-full" />
                  </div>
                </div>
                {/* 끝 핸들 — 터치 영역 44×44px, 시각적 핸들은 내부 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `calc(${(trimEnd / duration) * 100}% - 22px)`, width: 44, height: 44 }}
                >
                  <div className={`w-4 h-7 rounded-sm flex items-center justify-center ${draggingHandle === "end" ? "bg-accent" : "bg-accent/80"}`}>
                    <div className="w-0.5 h-3 bg-bg rounded-full" />
                  </div>
                </div>
              </div>

              {/* 타임라인 눈금 */}
              <div className="relative flex justify-between mt-1 px-0.5">
                {Array.from({ length: Math.min(Math.max(3, Math.ceil(duration / 30) + 1), 7) }, (_, i, arr = Array.from({ length: Math.min(Math.max(3, Math.ceil(duration / 30) + 1), 7) })) => {
                  const t = (i / (arr.length - 1)) * duration;
                  return (
                    <span key={i} className="text-[9px] font-stat text-text-3/60 tabular-nums">
                      {fmt(Math.round(t))}
                    </span>
                  );
                })}
              </div>

              {duration === trimmedDuration && (
                <p className="mt-1.5 text-[10px] text-text-3">드래그하여 원하는 구간만 선택할 수 있어요</p>
              )}
            </div>
          )}

          {/* 꾸미기 옵션 — 항상 노출 */}
          <div className="px-4 pt-3 flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-text-2">꾸미기</h3>

            {/* 인트로 카드 토글 */}
            <EffectsToggle
              effects={effects}
              onChange={(partial) => useUploadStore.getState().setEffects(partial)}
            />

            {/* 스포트라이트 위치 */}
            {frameUrl && (
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-text-2">주인공 위치</h3>
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-black"
                  onClick={handleSpotlightTap}
                >
                  <img src={frameUrl} alt="프레임" className="w-full h-auto block" style={{ maxHeight: "200px", objectFit: "contain" }} />
                  {spotlightX !== null && spotlightY !== null && (
                    <div
                      className="absolute"
                      style={{
                        left: `${spotlightX * 100}%`,
                        top: `${spotlightY * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-full"
                        style={{
                          border: "3px solid #D4A853",
                          background: "radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)",
                          boxShadow: "0 0 12px rgba(212,168,83,0.4)",
                        }}
                      />
                    </div>
                  )}
                  {spotlightX === null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full animate-pulse"
                        style={{
                          border: "2px dashed rgba(212,168,83,0.5)",
                          background: "radial-gradient(circle, rgba(212,168,83,0.1) 0%, transparent 70%)",
                        }}
                      />
                      <span className="rounded-lg bg-black/70 px-3 py-1.5 text-[11px] text-white/80 font-medium">
                        영상에서 선수 위치를 탭하세요
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 올리기 버튼 */}
          <div className="px-4 pt-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <button
              type="button"
              onClick={() => startUpload()}
              disabled={isUploading}
              className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg transition-opacity active:scale-[0.99] disabled:opacity-40"
            >
              {isUploading ? "업로드 중..." : "올리기"}
            </button>
          </div>
        </div>
      )}

      {/* ── 업로드 완료 딜라이트 화면 ── */}
      {showDone && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-sm animate-fade-up">
          {/* 골드 체크마크 */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 mb-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-text-1 mb-1">업로드 완료!</h2>
          <p className="text-[13px] text-text-3 mb-8">영상이 프로필에 등록되었어요</p>

          {/* 액션 버튼들 */}
          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              type="button"
              onClick={() => {
                useUploadStore.getState().reset();
                router.push("/profile");
              }}
              className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg active:scale-[0.99]"
            >
              프로필에서 확인
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Footory 하이라이트", url: window.location.origin + "/profile" }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.origin + "/profile").then(() => {
                    alert("링크가 복사되었어요!");
                  });
                }
              }}
              className="w-full rounded-xl border border-white/[0.08] bg-card py-3.5 text-[15px] font-medium text-text-1 active:scale-[0.99]"
            >
              공유하기
            </button>
          </div>
        </div>
      )}

      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*,video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm,.avi"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    }, 10_000);
    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      clearTimeout(timeoutId);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}
