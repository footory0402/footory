import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";

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
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 300_000 });
}
