import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const exec = promisify(execFile);

const RING_IMAGE = "/app/assets/ring_gold.png";

interface RingParams {
  spotlightX?: number; // 0-1 normalized
  spotlightY?: number; // 0-1 normalized
}

/**
 * Pass 3: 골드 링 오버레이
 * spotlight 좌표에 ring_gold.png를 0-2초간 표시
 */
export async function passRing(
  inputPath: string,
  outputPath: string,
  params: RingParams
): Promise<void> {
  if (
    params.spotlightX === undefined ||
    params.spotlightY === undefined ||
    !existsSync(RING_IMAGE)
  ) {
    // 링 이미지 없거나 좌표 없으면 복사
    const args = ["-y", "-i", inputPath, "-c", "copy", outputPath];
    await exec("ffmpeg", args, { timeout: 60_000 });
    return;
  }

  // 1920x1080 기준 절대 좌표 계산
  const x = Math.round(params.spotlightX * 1920) - 60; // 링 크기 120px 기준 중앙
  const y = Math.round(params.spotlightY * 1080) - 60;

  const args = [
    "-y",
    "-i", inputPath,
    "-i", RING_IMAGE,
    "-filter_complex",
    `[1:v]scale=120:120[ring];` +
      `[0:v][ring]overlay=x=${x}:y=${y}:enable='between(t\\,0\\,2)'`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "copy",
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 120_000 });
}
