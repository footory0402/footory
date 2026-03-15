import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { OUTPUT_W, OUTPUT_H, CODEC, PRESET, CRF } from "./config";

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

  // 출력 해상도 기준 절대 좌표 계산
  const ringSize = 80; // 720p 비례 축소 (1080p: 120px)
  const x = Math.round(params.spotlightX * OUTPUT_W) - ringSize / 2;
  const y = Math.round(params.spotlightY * OUTPUT_H) - ringSize / 2;

  const args = [
    "-y",
    "-i", inputPath,
    "-i", RING_IMAGE,
    "-filter_complex",
    `[1:v]scale=${ringSize}:${ringSize}[ring];` +
      `[0:v][ring]overlay=x=${x}:y=${y}:enable='between(t\\,0\\,2)'`,
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    "-c:a", "copy",
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 120_000 });
}
