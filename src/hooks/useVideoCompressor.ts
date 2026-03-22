"use client";

import { useState, useCallback, useRef } from "react";
import {
  isCompressionSupported,
  loadFFmpeg,
  compressVideo,
  type CompressOptions,
} from "@/lib/video-compressor";

export type CompressStatus =
  | "idle"
  | "loading" // WASM 바이너리 로드 중
  | "compressing" // 압축 진행 중
  | "done" // 압축 완료
  | "error" // 에러
  | "unsupported"; // WASM 미지원

interface CompressStats {
  originalSize: number;
  compressedSize: number;
  ratio: number; // 0~1 (compressedSize / originalSize)
}

interface UseVideoCompressorReturn {
  /** 압축 시작 */
  compress: (
    file: File,
    options?: Omit<CompressOptions, "onProgress">
  ) => Promise<File | null>;
  /** 압축 진행률 (0-100) */
  progress: number;
  /** 현재 상태 */
  status: CompressStatus;
  /** 압축된 파일 */
  compressedFile: File | null;
  /** 크기 통계 */
  stats: CompressStats | null;
  /** 에러 메시지 */
  error: string | null;
  /** WASM 로드 완료 여부 */
  isReady: boolean;
  /** 압축 취소 */
  cancel: () => void;
  /** 상태 초기화 */
  reset: () => void;
  /** WASM 미리 로드 (선택) */
  preload: () => void;
}

export function useVideoCompressor(): UseVideoCompressorReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<CompressStatus>(
    isCompressionSupported() ? "idle" : "unsupported"
  );
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [stats, setStats] = useState<CompressStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const cancelledRef = useRef(false);

  const preload = useCallback(() => {
    if (!isCompressionSupported()) return;
    loadFFmpeg()
      .then(() => setIsReady(true))
      .catch(() => {});
  }, []);

  const compress = useCallback(
    async (
      file: File,
      options?: Omit<CompressOptions, "onProgress">
    ): Promise<File | null> => {
      if (!isCompressionSupported()) {
        setStatus("unsupported");
        return null;
      }

      cancelledRef.current = false;
      setError(null);
      setCompressedFile(null);
      setStats(null);
      setProgress(0);
      setStatus("loading");

      try {
        // WASM 로드
        await loadFFmpeg((ratio) => {
          if (!cancelledRef.current) {
            setProgress(Math.round(ratio * 10)); // 로딩은 0~10%
          }
        });
        setIsReady(true);

        if (cancelledRef.current) return null;

        setStatus("compressing");

        const result = await compressVideo(file, {
          ...options,
          onProgress: (pct) => {
            if (!cancelledRef.current) {
              setProgress(10 + Math.round(pct * 0.9)); // 압축은 10~100%
            }
          },
        });

        if (cancelledRef.current) return null;

        const compStats: CompressStats = {
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          ratio: result.compressedSize / result.originalSize,
        };

        setCompressedFile(result.file);
        setStats(compStats);
        setProgress(100);
        setStatus("done");

        return result.file;
      } catch (err) {
        if (cancelledRef.current) return null;

        const msg =
          err instanceof Error ? err.message : "영상 압축에 실패했어요";
        console.error("[VideoCompressor]", msg);
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus("idle");
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setStatus(isCompressionSupported() ? "idle" : "unsupported");
    setProgress(0);
    setCompressedFile(null);
    setStats(null);
    setError(null);
  }, []);

  return {
    compress,
    progress,
    status,
    compressedFile,
    stats,
    error,
    isReady,
    cancel,
    reset,
    preload,
  };
}
