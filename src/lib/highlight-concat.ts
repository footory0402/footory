import type { ClipSegment } from "@/components/editor/video/types";
import type { ProcessingStep } from "@/components/editor/video/ProcessingView";
import { getPublicVideoUrl } from "@/lib/r2-client";

interface ConcatOptions {
  videoFile: File;
  clips: ClipSegment[];
  onStep: (step: ProcessingStep) => void;
  onTrimProgress: (done: number) => void;
}

interface ConcatResult {
  clipId: string;
  videoUrl: string;
}

let cachedFFmpeg: any = null;

/** marking 상태 진입 시 호출하여 백그라운드로 FFmpeg 프리로딩 */
export async function preloadFFmpeg(): Promise<void> {
  if (cachedFFmpeg) return;
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  cachedFFmpeg = ffmpeg;
}

export async function concatHighlight({ videoFile, clips, onStep, onTrimProgress }: ConcatOptions): Promise<ConcatResult> {
  // 1. FFmpeg 로딩
  onStep("loading");
  if (!cachedFFmpeg) {
    await preloadFFmpeg();
  }
  const ffmpeg = cachedFFmpeg;

  // 2. 원본 파일을 WASM FS에 쓰기
  const buf = await videoFile.arrayBuffer();
  await ffmpeg.writeFile("input.mp4", new Uint8Array(buf));

  // 3. 각 세그먼트 trim (-c copy)
  onStep("trimming");
  const segNames: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const segName = `seg${i}.mp4`;
    segNames.push(segName);

    await ffmpeg.exec([
      "-ss", String(clip.startTime),
      "-t", String(clip.endTime - clip.startTime),
      "-i", "input.mp4",
      "-c", "copy",
      "-avoid_negative_ts", "make_zero",
      segName,
    ]);

    onTrimProgress(i + 1);
  }

  // 4. concat demuxer
  onStep("concat");
  const listContent = segNames.map((s) => `file '${s}'`).join("\n");
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listContent));

  await ffmpeg.exec([
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-c", "copy", "-movflags", "+faststart",
    "highlight.mp4",
  ]);

  const output = await ffmpeg.readFile("highlight.mp4");
  const outputBlob = new Blob([output.buffer], { type: "video/mp4" });

  // 5. WASM FS 정리
  await ffmpeg.deleteFile("input.mp4").catch(() => {});
  for (const s of segNames) await ffmpeg.deleteFile(s).catch(() => {});
  await ffmpeg.deleteFile("list.txt").catch(() => {});
  await ffmpeg.deleteFile("highlight.mp4").catch(() => {});

  // 6. R2 업로드 (presigned URL)
  onStep("uploading");
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: "video/mp4", prefix: "originals" }),
  });
  if (!presignRes.ok) throw new Error("Presigned URL 발급 실패");
  const { url: uploadUrl, key, clipId } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: outputBlob,
  });
  if (!putRes.ok) throw new Error(`R2 업로드 실패 (${putRes.status})`);

  const videoUrl = getPublicVideoUrl(key);

  // 7. DB 레코드 생성
  onStep("saving");
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);

  const clipRes = await fetch("/api/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clip_id: clipId,
      video_url: videoUrl,
      duration_seconds: Math.round(totalDuration),
      file_size_bytes: outputBlob.size,
      memo: `하이라이트 ${clips.length}개 구간`,
      client_trimmed: true,
    }),
  });
  if (!clipRes.ok) throw new Error("클립 저장 실패");

  return { clipId, videoUrl };
}
