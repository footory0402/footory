"use client";

import { useRef } from "react";
import { useUploadStore } from "@/stores/upload-store";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 5 * 60; // 5 minutes

export default function VideoSelector() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { file, error, setFile, setError, nextStep } = useUploadStore();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    if (!selected.type.startsWith("video/")) {
      setError("영상 파일만 업로드할 수 있습니다.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("파일 크기는 100MB 이하만 가능합니다.");
      return;
    }

    // Check duration
    const duration = await getVideoDuration(selected);
    if (duration > MAX_DURATION) {
      setError("영상 길이는 5분 이하만 가능합니다.");
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleNext = () => {
    if (!file) return;
    nextStep();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-card)] transition-colors hover:border-[var(--color-accent)]"
      >
        {file ? (
          <>
            <span className="text-3xl">🎬</span>
            <span className="text-sm font-medium text-[var(--color-text)]">{file.name}</span>
            <span className="text-xs text-[var(--color-text-3)]">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </>
        ) : (
          <>
            <span className="text-4xl">📹</span>
            <span className="text-sm font-medium text-[var(--color-text-2)]">
              영상을 선택하세요
            </span>
            <span className="text-xs text-[var(--color-text-3)]">
              MP4 · 최대 5분 · 100MB 이하
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleSelect}
      />

      {error && (
        <div className="flex w-full items-start gap-2 rounded-lg bg-red/10 px-3 py-2.5 text-sm text-red ring-1 ring-red/30">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled={!file}
        onClick={handleNext}
        className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-sm font-bold text-[var(--color-bg)] transition-opacity disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
