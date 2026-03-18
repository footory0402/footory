"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useUploadStore } from "@/stores/upload-store";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 120; // 120초 (2분)

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

    // iOS Safari에서 MOV 파일의 MIME type이 빈 문자열이거나
    // application/octet-stream으로 보고될 수 있음
    const isVideo =
      selected.type.startsWith("video/") ||
      selected.type === "application/octet-stream" ||
      selected.type === "" ||
      /\.(mp4|mov|m4v|webm|avi)$/i.test(selected.name);
    if (!isVideo) {
      setError("영상 파일이 아닌 것 같아요. MP4 또는 MOV 파일을 선택해주세요.");
      return;
    }

    const sizeMB = (selected.size / 1024 / 1024).toFixed(0);
    if (selected.size > MAX_SIZE) {
      setError(
        `영상이 ${sizeMB}MB예요. 100MB 이내의 영상을 선택해주세요.\n촬영 시 해상도를 1080p로 설정하면 용량을 줄일 수 있어요.`
      );
      return;
    }

    const dur = await getVideoDuration(selected);
    if (dur > MAX_DURATION) {
      const m = Math.floor(dur / 60);
      const s = Math.round(dur % 60);
      setError(
        `영상이 ${m}분 ${s}초예요. 하이라이트는 2분 이내가 좋아요.\n갤러리에서 영상을 잘라서 다시 선택해주세요.`
      );
      return;
    }

    setFile(selected);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : "0";
  const sizePercent = file ? Math.min((file.size / MAX_SIZE) * 100, 100) : 0;
  const durationPercent = duration
    ? Math.min((duration / MAX_DURATION) * 100, 100)
    : 0;

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
                  <span className="text-[11px] text-text-3 font-stat">{sizeMB} / 100MB</span>
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
                  <span className="text-[11px] text-text-3 font-stat">{formatDuration(duration)} / 2:00</span>
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
              하이라이트 영상을 선택하세요
            </span>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                2분 이내
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                100MB 이내
              </span>
            </div>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*,video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm,.avi"
        capture="environment"
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
        <div className="rounded-xl bg-[#2a1f1f] px-4 py-3 ring-1 ring-[#ff6b6b]/20">
          <p className="text-[13px] leading-relaxed text-[#ff8a8a] whitespace-pre-line">{error}</p>
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

    // 메타데이터 로딩 타임아웃 (10초)
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
