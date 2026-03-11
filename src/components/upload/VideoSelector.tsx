"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useUploadStore } from "@/stores/upload-store";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 5 * 60; // 5 minutes

export default function VideoSelector() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { file, error, setFile, setError } = useUploadStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // Generate video thumbnail preview
  useEffect(() => {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    video.onloadedmetadata = () => {
      setDuration(Math.round(video.duration));
      const seekTo = Math.min(2, video.duration * 0.5);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL("image/jpeg", 0.8));
      }
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setPreview(null);
    setDuration(0);

    if (!selected.type.startsWith("video/")) {
      setError("영상 파일만 업로드할 수 있습니다.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("파일 크기는 100MB 이하만 가능합니다.");
      return;
    }

    const dur = await getVideoDuration(selected);
    if (dur > MAX_DURATION) {
      setError("영상 길이는 5분 이하만 가능합니다.");
      return;
    }

    setFile(selected);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-1">영상 선택</h3>

      {file && preview ? (
        /* ── Selected: thumbnail + info ── */
        <div className="relative overflow-hidden rounded-xl bg-card">
          <div className="relative aspect-video w-full">
            <Image
              src={preview}
              alt="미리보기"
              fill
              unoptimized
              sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
              className="object-cover"
            />
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-stat text-text-1">
              {formatDuration(duration)}
            </div>
          </div>
          {/* File info row */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-lg">🎬</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-1">
                  {file.name}
                </p>
                <p className="text-[11px] text-text-3">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setDuration(0);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-full p-1.5 text-text-3 transition-colors active:bg-surface"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty: file picker ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-card transition-colors active:border-accent"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bg)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <span className="text-sm font-medium text-text-2">
            영상을 선택하세요
          </span>
          <span className="text-xs text-text-3">
            MP4 · 최대 5분 · 100MB 이하
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*,video/mp4,video/quicktime,.mp4,.mov"
        className="hidden"
        onChange={handleSelect}
      />

      {/* Change button when file selected */}
      {file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent transition-colors active:bg-[var(--accent-bg)]"
        >
          다른 영상 선택
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red/10 px-3 py-2.5 text-sm text-red ring-1 ring-red/30">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
