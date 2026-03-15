import { execFile } from "child_process";
import { promisify } from "util";
import {
  OUTPUT_W,
  OUTPUT_H,
  CODEC,
  PRESET,
  CRF,
  AUDIO_CODEC,
  AUDIO_BITRATE,
  LETTERBOX_H,
} from "./config.js";

const exec = promisify(execFile);

interface ColorParams {
  trimStart?: number;
  trimEnd?: number;
  colorEnabled?: boolean;
  cinematicEnabled?: boolean;
}

/**
 * Pass 1: 색보정 + 스케일 + 시네마틱 레터박스
 * 입력: raw 영상 → 출력: 1280x720 색보정 영상
 */
export async function passColor(
  inputPath: string,
  outputPath: string,
  params: ColorParams
): Promise<void> {
  const args: string[] = ["-y", "-i", inputPath];

  if (params.trimStart !== undefined && params.trimStart > 0) {
    args.push("-ss", String(params.trimStart));
  }
  if (params.trimEnd !== undefined) {
    args.push("-to", String(params.trimEnd));
  }

  const filters: string[] = [
    `scale=${OUTPUT_W}:${OUTPUT_H}:force_original_aspect_ratio=decrease`,
    `pad=${OUTPUT_W}:${OUTPUT_H}:(${OUTPUT_W}-iw)/2:(${OUTPUT_H}-ih)/2:color=0x0C0C0E`,
  ];

  if (params.colorEnabled !== false) {
    filters.push(
      "eq=brightness=0.04:contrast=1.08:saturation=1.15",
      "vignette=PI/5"
    );
  }

  if (params.cinematicEnabled !== false) {
    filters.push(
      `drawbox=x=0:y=0:w=${OUTPUT_W}:h=${LETTERBOX_H}:color=0x000000:t=fill`,
      `drawbox=x=0:y=${OUTPUT_H - LETTERBOX_H}:w=${OUTPUT_W}:h=${LETTERBOX_H}:color=0x000000:t=fill`
    );
  }

  args.push(
    "-vf", filters.join(","),
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    "-c:a", AUDIO_CODEC, "-b:a", AUDIO_BITRATE,
    "-movflags", "+faststart",
    outputPath
  );

  await exec("ffmpeg", args, { timeout: 300_000 });
}
