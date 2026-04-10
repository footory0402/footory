"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useUploadStore } from "@/stores/upload-store";
import { prepareR2BackgroundUpload } from "@/lib/upload-service";
import UploadInlineError from "@/components/upload/UploadInlineError";
import {
  MAX_UPLOAD_VIDEO_DURATION,
  MAX_UPLOAD_VIDEO_SIZE,
  validateUploadVideoFile,
} from "@/lib/upload-video-file";

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
      useUploadStore.getState().setDuration(Math.round(video.duration));
      const seekTo = Math.min(2, video.duration * 0.5);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      // 실제 영상 비율 유지 (최대 640px 기준 리사이즈)
      const maxW = 640;
      const ratio = video.videoWidth / video.videoHeight || 16 / 9;
      canvas.width = maxW;
      canvas.height = Math.round(maxW / ratio);
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

    const { duration: dur, error: validationError } = await validateUploadVideoFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selected);
    useUploadStore.getState().setDuration(Math.round(dur));

    setTimeout(() => {
      prepareR2BackgroundUpload();
    }, 0);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : "0";
  const sizePercent = file ? Math.min((file.size / MAX_UPLOAD_VIDEO_SIZE) * 100, 100) : 0;
  const durationPercent = duration
    ? Math.min((duration / MAX_UPLOAD_VIDEO_DURATION) * 100, 100)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-1">영상 선택</h3>

      {file && preview ? (
        /* ── Selected: thumbnail + info ── */
        <div className="relative overflow-hidden rounded-xl bg-card">
          <div className="relative w-full bg-black" style={{ aspectRatio: "auto" }}>
            <Image
              src={preview}
              alt="미리보기"
              width={640}
              height={360}
              unoptimized
              sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
              className="w-full h-auto block"
            />
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-stat text-text-1">
              {formatDuration(duration)}
            </div>
          </div>

          {/* File info + usage bars */}
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-1">
                    {file.name}
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
                  const s = useUploadStore.getState();
                  s.setCompressStatus("idle");
                  s.setCompressProgress(0);
                  s.setCompressedFile(null);
                  s.setCompressStats(null, null);
                }}
                className="rounded-full p-1.5 text-text-3 transition-colors active:bg-surface"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Usage indicators */}
            <div className="mt-2 flex gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-3">용량</span>
                  <span className="text-[11px] text-text-3 font-stat">{sizeMB} / 200MB</span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${sizePercent}%`,
                      backgroundColor: sizePercent > 85 ? "var(--color-accent)" : "var(--color-accent)",
                      opacity: sizePercent > 85 ? 1 : 0.6,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-3">길이</span>
                  <span className="text-[11px] text-text-3 font-stat">{formatDuration(duration)} / 5:00</span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${durationPercent}%`,
                      backgroundColor: "var(--color-accent)",
                      opacity: durationPercent > 85 ? 1 : 0.6,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Empty: file picker ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-card transition-colors active:border-accent"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bg)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-sm font-medium text-text-2">
              스킬 영상을 선택하세요
            </span>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                5분 이내
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                200MB 이내
              </span>
            </div>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*,video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm,.avi"
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
        <UploadInlineError message={error} />
      )}
    </div>
  );
}
