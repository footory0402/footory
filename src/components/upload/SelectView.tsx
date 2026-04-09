"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { prepareR2BackgroundUpload } from "@/lib/upload-service";
import Link from "next/link";

const MAX_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DURATION = 300; // 5분

interface SelectViewProps {
  onFileReady: () => void;
}

export default function SelectView({ onFileReady }: SelectViewProps) {
  const store = useUploadStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Trim (local state synced to store)
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(null);

  // 파일 선택 시 비디오 URL 생성
  useEffect(() => {
    if (!store.file) return;
    const url = URL.createObjectURL(store.file);
    setVideoUrl(url);

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.src = url;

    tempVideo.onloadedmetadata = () => {
      const dur = Math.round(tempVideo.duration);
      setDuration(dur);
      setTrimEnd(dur);
      useUploadStore.getState().setDuration(dur);
    };

    tempVideo.onerror = () => {};
    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
    };
  }, [store.file]);

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
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

  }, []);

  const handleTrimDrag = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, type: "start" | "end") => {
    const bar = trimBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = Math.round(ratio * duration);
    if (type === "start") {
      const clamped = Math.min(time, trimEnd - 1);
      setTrimStart(clamped);
      useUploadStore.getState().setTrimStart(clamped);
    } else {
      const clamped = Math.max(time, trimStart + 1);
      setTrimEnd(clamped);
      useUploadStore.getState().setTrimEnd(clamped);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = type === "start" ? Math.min(time, trimEnd - 1) : Math.max(time, trimStart + 1);
    }
  }, [duration, trimStart, trimEnd]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const trimmedDuration = trimEnd - trimStart;

  // 파일 미선택 상태
  if (!store.file) {
    return (
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

  // 파일 선택 완료 — 프리뷰 + 트림
  return (
    <div className="flex flex-col gap-0 animate-fade-up">
      {/* 영상 미리보기 */}
      <div className="relative bg-black">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            preload="auto"
            className="w-full h-auto block"
            style={{ maxHeight: "45vh", objectFit: "contain" }}
          />
        )}

        {/* 파일 정보 오버레이 */}
        <div className="absolute bottom-2 left-3 flex items-center gap-2 pointer-events-none">
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
              const type = Math.abs(time - trimStart) < Math.abs(time - trimEnd) ? "start" : "end";
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
              const type = Math.abs(time - trimStart) < Math.abs(time - trimEnd) ? "start" : "end";
              setDraggingHandle(type);
              handleTrimDrag(e, type);

              const onMove = (ev: TouchEvent) => handleTrimDrag(ev as unknown as React.TouchEvent<HTMLDivElement>, type);
              const onUp = () => { setDraggingHandle(null); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onUp); };
              document.addEventListener("touchmove", onMove);
              document.addEventListener("touchend", onUp);
            }}
          >
            <div
              className="absolute inset-y-0 bg-accent/20"
              style={{
                left: `${(trimStart / duration) * 100}%`,
                width: `${((trimEnd - trimStart) / duration) * 100}%`,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ left: `calc(${(trimStart / duration) * 100}% - 22px)`, width: 44, height: 44 }}
            >
              <div className={`w-4 h-7 rounded-sm flex items-center justify-center ${draggingHandle === "start" ? "bg-accent" : "bg-accent/80"}`}>
                <div className="w-0.5 h-3 bg-bg rounded-full" />
              </div>
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ left: `calc(${(trimEnd / duration) * 100}% - 22px)`, width: 44, height: 44 }}
            >
              <div className={`w-4 h-7 rounded-sm flex items-center justify-center ${draggingHandle === "end" ? "bg-accent" : "bg-accent/80"}`}>
                <div className="w-0.5 h-3 bg-bg rounded-full" />
              </div>
            </div>
          </div>

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

      {/* 다음 단계 버튼 */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            onFileReady();
            setTimeout(() => {
              prepareR2BackgroundUpload();
            }, 0);
          }}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg transition-opacity active:scale-[0.99]"
        >
          다음
        </button>
      </div>

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
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}
