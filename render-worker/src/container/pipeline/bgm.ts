import { execFile } from "child_process";
import { promisify } from "util";
import { downloadFromR2 } from "../r2.js";

const exec = promisify(execFile);

interface BgmParams {
  bgmR2Key: string;
  originalVolume?: number; // default 0.5
  bgmVolume?: number; // default 0.5
}

/**
 * Pass 7: BGM 믹스
 * 원본 오디오 50% + BGM 50%, 영상 길이에 맞춰 트림
 */
export async function passBgm(
  inputPath: string,
  bgmLocalPath: string,
  outputPath: string,
  params: BgmParams
): Promise<void> {
  const origVol = params.originalVolume ?? 0.5;
  const bgmVol = params.bgmVolume ?? 0.5;

  const args = [
    "-y",
    "-i", inputPath,
    "-i", bgmLocalPath,
    "-filter_complex",
    `[0:a]volume=${origVol}[a0];` +
      `[1:a]volume=${bgmVol}[a1];` +
      `[a0][a1]amix=inputs=2:duration=shortest`,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 180_000 });
}

/**
 * BGM 파일 다운로드 (R2에서)
 */
export async function downloadBgm(
  r2Key: string,
  localPath: string
): Promise<void> {
  await downloadFromR2(r2Key, localPath);
}
