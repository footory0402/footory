import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface ColorParams {
  trimStart?: number;
  trimEnd?: number;
  colorEnabled?: boolean;
  cinematicEnabled?: boolean;
}

/**
 * Pass 1: 색보정 + 스케일 + 시네마틱 레터박스
 * 입력: raw 영상 → 출력: 1920x1080 색보정 영상
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
    "scale=1920:1080:force_original_aspect_ratio=decrease",
    "pad=1920:1080:(1920-iw)/2:(1080-ih)/2:color=0x0C0C0E",
  ];

  if (params.colorEnabled !== false) {
    filters.push(
      "eq=brightness=0.04:contrast=1.08:saturation=1.15",
      "vignette=PI/5"
    );
  }

  if (params.cinematicEnabled !== false) {
    filters.push(
      "drawbox=x=0:y=0:w=1920:h=60:color=0x000000:t=fill",
      "drawbox=x=0:y=1020:w=1920:h=60:color=0x000000:t=fill"
    );
  }

  args.push(
    "-vf", filters.join(","),
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath
  );

  await exec("ffmpeg", args, { timeout: 300_000 });
}
