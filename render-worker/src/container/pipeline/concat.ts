import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { CODEC, PRESET, CRF, AUDIO_CODEC, AUDIO_BITRATE } from "./config";

const exec = promisify(execFile);

/**
 * Pass 6: concat (인트로 + 메인 + 슬로모 리플레이)
 * FFmpeg concat demuxer 사용
 */
export async function passConcat(
  segments: string[],
  outputPath: string
): Promise<void> {
  if (segments.length === 0) {
    throw new Error("No segments to concat");
  }

  if (segments.length === 1) {
    // 세그먼트 1개면 복사
    const args = ["-y", "-i", segments[0], "-c", "copy", outputPath];
    await exec("ffmpeg", args, { timeout: 60_000 });
    return;
  }

  // concat list 파일 생성
  const listPath = join(dirname(outputPath), "concat_list.txt");
  const listContent = segments.map((s) => `file '${s}'`).join("\n");
  await writeFile(listPath, listContent);

  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    "-c:a", AUDIO_CODEC, "-b:a", AUDIO_BITRATE,
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 300_000 });
}
