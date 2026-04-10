"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { prepareR2BackgroundUpload } from "@/lib/upload-service";
import UploadInlineError from "@/components/upload/UploadInlineError";
import { validateUploadVideoFile } from "@/lib/upload-video-file";

interface SelectViewProps {
  onFileReady?: () => void;
  ctaLabel?: string | null;
  startBackgroundUploadOnReady?: boolean;
}

export default function SelectView({
  onFileReady,
  ctaLabel = "영상 올리기",
  startBackgroundUploadOnReady = true,
}: SelectViewProps) {
  const store = useUploadStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      const uploadStore = useUploadStore.getState();
      uploadStore.setDuration(dur);
      uploadStore.setTrimStart(0);
      uploadStore.setTrimEnd(dur);
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
    const { duration: dur, error: validationError } = await validateUploadVideoFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }

    useUploadStore.getState().setFile(selected);
    useUploadStore.getState().setDuration(Math.round(dur));

  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

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
            <span className="text-[15px] font-semibold text-text-1">영상을 골라요</span>
            <span className="text-[12px] text-text-3">MP4, MOV · 5분 이내 · 200MB 이내</span>
          </div>
        </button>
        {error && (
          <div className="mt-3">
            <UploadInlineError message={error} />
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
          다시 고르기
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-[24px] border border-white/[0.06] bg-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-text-1">먼저 올리고, 필요한 것만 편집해요</p>
              <p className="mt-1 text-[12px] leading-5 text-text-3">
                업로드가 끝나면 주인공 찾기와 확대 재생부터 바로 확인할 수 있어요.
              </p>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
              {fmt(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      {ctaLabel && onFileReady ? (
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              onFileReady();
              if (startBackgroundUploadOnReady) {
                setTimeout(() => {
                  prepareR2BackgroundUpload();
                }, 0);
              }
            }}
            className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg transition-opacity active:scale-[0.99]"
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}

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
