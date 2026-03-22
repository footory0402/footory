/**
 * FFmpeg WASM 기반 클라이언트 측 영상 압축.
 * Single-threaded core 사용 (SharedArrayBuffer/COOP/COEP 불필요).
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Single-threaded ESM core (COOP/COEP 헤더 불필요)
const CORE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export function isCompressionSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}

/**
 * FFmpeg WASM 바이너리를 로드한다 (lazy, singleton).
 * 첫 호출 시 ~25MB WASM을 다운로드하며, 이후 브라우저 캐시에서 즉시 로드.
 */
export function loadFFmpeg(
  onProgress?: (ratio: number) => void
): Promise<FFmpeg> {
  if (ffmpeg) return Promise.resolve(ffmpeg);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ff = new FFmpeg();

    ff.on("log", ({ message }) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[ffmpeg]", message);
      }
    });

    const coreURL = await toBlobURL(
      `${CORE_URL}/ffmpeg-core.js`,
      "text/javascript",
      true,
      (e) => onProgress?.(e.done ? 0.5 : (e.received / Math.max(e.total, 1)) * 0.5)
    );
    const wasmURL = await toBlobURL(
      `${CORE_URL}/ffmpeg-core.wasm`,
      "application/wasm",
      true,
      (e) =>
        onProgress?.(
          0.5 + (e.done ? 0.5 : (e.received / Math.max(e.total, 1)) * 0.5)
        )
    );

    await ff.load({ coreURL, wasmURL });
    ffmpeg = ff;
    return ff;
  })();

  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export interface CompressOptions {
  /** 720p 기준 해상도 (기본 720) */
  targetShortSide?: number;
  /** 비트레이트 (기본 '2M') */
  bitrate?: string;
  /** CRF (기본 28) */
  crf?: number;
  /** 트림 시작 (초) */
  trimStart?: number;
  /** 트림 끝 (초) */
  trimEnd?: number;
  /** 진행률 콜백 (0-100) */
  onProgress?: (percent: number) => void;
  /** 타임아웃 (ms, 기본 120_000) */
  timeout?: number;
}

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

/**
 * 영상을 720p로 압축 + 트림한다.
 * - 가로 영상: 1280x720
 * - 세로 영상: 720x1280
 * - 비율 유지, 짝수 해상도 보장
 */
export async function compressVideo(
  inputFile: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    targetShortSide = 720,
    bitrate = "2M",
    crf = 28,
    trimStart,
    trimEnd,
    onProgress,
    timeout = 120_000,
  } = options;

  if (!isCompressionSupported()) {
    throw new Error("WASM not supported");
  }

  const ff = await loadFFmpeg();

  // Progress 핸들러 등록
  let progressHandler: ((_: { progress: number }) => void) | null = null;
  if (onProgress) {
    progressHandler = ({ progress }: { progress: number }) => {
      // FFmpeg progress는 0~1, 가끔 1 초과
      onProgress(Math.min(Math.round(progress * 100), 99));
    };
    ff.on("progress", progressHandler);
  }

  // 타임아웃 설정
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    ff.terminate();
  }, timeout);

  try {
    // 입력 파일 쓰기
    const inputData = await fetchFile(inputFile);
    await ff.writeFile("input", inputData);

    // FFmpeg 명령 조합
    const args: string[] = [];

    // 트림 (input option — 빠른 키프레임 탐색)
    if (trimStart !== undefined && trimStart > 0) {
      args.push("-ss", String(trimStart));
    }

    args.push("-i", "input");

    // 트림 끝 (duration 계산)
    if (trimEnd !== undefined) {
      const duration = trimEnd - (trimStart || 0);
      if (duration > 0) {
        args.push("-t", String(duration));
      }
    }

    // 720p 스케일 (가로/세로 자동 판별, 짝수 보장)
    // iw >= ih (가로): height=720, width=auto
    // iw < ih (세로): width=720, height=auto
    const s = targetShortSide;
    const scaleFilter = `scale='if(gte(iw,ih),-2,${s})':'if(gte(iw,ih),${s},-2)'`;
    args.push("-vf", scaleFilter);

    // H.264 인코딩
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-b:v",
      bitrate,
      "-crf",
      String(crf)
    );

    // AAC 오디오
    args.push("-c:a", "aac", "-b:a", "128k");

    // MP4 faststart (스트리밍 최적화)
    args.push("-movflags", "+faststart");

    // 출력
    args.push("-y", "output.mp4");

    await ff.exec(args);

    if (timedOut) {
      throw new Error("압축 시간 초과 (2분)");
    }

    // 출력 파일 읽기
    const outputData = await ff.readFile("output.mp4");
    const blob = new Blob([new Uint8Array(outputData as Uint8Array)], {
      type: "video/mp4",
    });
    const outputName = inputFile.name.replace(/\.[^.]+$/, "_720p.mp4");
    const compressedFile = new File([blob], outputName, { type: "video/mp4" });

    onProgress?.(100);

    return {
      file: compressedFile,
      originalSize: inputFile.size,
      compressedSize: compressedFile.size,
    };
  } catch (err) {
    if (timedOut) {
      // terminate 후 새 인스턴스 필요
      ffmpeg = null;
      loadPromise = null;
      throw new Error("압축 시간 초과 (2분)");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    // progress 핸들러 정리
    if (progressHandler) {
      ff.off("progress", progressHandler);
    }
    // 파일 정리 (에러 무시)
    try {
      await ff.deleteFile("input");
    } catch {}
    try {
      await ff.deleteFile("output.mp4");
    } catch {}
  }
}
