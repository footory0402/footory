import type { ClipSegment } from "@/components/editor/video/types";
type LegacyProcessingStep = "loading" | "trimming" | "concat" | "uploading" | "saving";
import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";
import { getPublicVideoUrl } from "@/lib/r2-client";
import { renderHudOverlay } from "@/lib/hud-canvas-renderer";

interface ConcatOptions {
  videoFile: File;
  clips: ClipSegment[];
  onStep: (step: LegacyProcessingStep) => void;
  onTrimProgress: (done: number) => void;
  /** HUD 오버레이 합성용 선수 데이터 (없으면 오버레이 생략) */
  playerData?: HudPlayerData | null;
  hudConfig?: HudConfig;
  /** 원본 영상 해상도 (HUD 렌더링에 사용) */
  videoWidth?: number;
  videoHeight?: number;
  /** 인트로 카드 포함 여부 */
  includeIntro?: boolean;
}

interface ConcatResult {
  clipId: string;
  videoUrl: string;
  /** 로컬 미리보기용 blob URL (COEP 환경에서 R2 URL 대신 사용) */
  previewBlobUrl: string;
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

export async function concatHighlight({
  videoFile, clips, onStep, onTrimProgress,
  playerData, hudConfig, videoWidth, videoHeight,
  includeIntro,
}: ConcatOptions): Promise<ConcatResult> {
  // 1. FFmpeg 로딩
  onStep("loading");
  if (!cachedFFmpeg) {
    try {
      await preloadFFmpeg();
    } catch {
      throw new Error("영상 처리 엔진을 불러오지 못했습니다. 브라우저를 새로고침 해주세요.");
    }
  }
  const ffmpeg = cachedFFmpeg;

  // 2. 원본 파일을 WASM FS에 쓰기
  const buf = await videoFile.arrayBuffer();
  await ffmpeg.writeFile("input.mp4", new Uint8Array(buf));

  const hasHud = !!playerData && !!hudConfig && !!videoWidth && !!videoHeight;
  const segNames: string[] = [];

  // 3. 인트로 카드 생성 (선택)
  if (includeIntro && hasHud) {
    try {
      const { fetchAndRenderCard } = await import("@/lib/card-renderer");
      const cardBlob = await fetchAndRenderCard();
      if (cardBlob) {
        const cardBytes = new Uint8Array(await cardBlob.arrayBuffer());
        await ffmpeg.writeFile("card.png", cardBytes);

        // 카드 이미지 → 2초 영상 (원본 해상도에 맞춤)
        await ffmpeg.exec([
          "-loop", "1",
          "-i", "card.png",
          "-c:v", "libx264",
          "-t", "2",
          "-pix_fmt", "yuv420p",
          "-vf", `scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:black`,
          "-r", "30",
          "intro.mp4",
        ]);
        segNames.push("intro.mp4");
        await ffmpeg.deleteFile("card.png").catch(() => {});
      }
    } catch (e) {
      console.warn("[highlight-concat] 인트로 카드 생성 실패, 건너뜀:", e);
    }
  }

  // 4. 각 세그먼트 trim + HUD 오버레이
  onStep("trimming");

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const segName = `seg${i}.mp4`;

    if (hasHud) {
      // 클립별 골 카운트 누적
      const goalCount = clips.slice(0, i + 1).filter((c) => c.eventTag === "goal").length;
      const hudPng = await renderHudOverlay({
        width: videoWidth,
        height: videoHeight,
        data: playerData,
        config: { ...hudConfig, goalCount },
        markerX: clip.markerX,
        markerY: clip.markerY,
      });
      await ffmpeg.writeFile(`hud${i}.png`, hudPng);

      // 재인코딩 + HUD 오버레이 합성
      await ffmpeg.exec([
        "-ss", String(clip.startTime),
        "-t", String(clip.endTime - clip.startTime),
        "-i", "input.mp4",
        "-i", `hud${i}.png`,
        "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-avoid_negative_ts", "make_zero",
        segName,
      ]);

      await ffmpeg.deleteFile(`hud${i}.png`).catch(() => {});
    } else {
      // HUD 없이 스트림 복사만
      await ffmpeg.exec([
        "-ss", String(clip.startTime),
        "-t", String(clip.endTime - clip.startTime),
        "-i", "input.mp4",
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        segName,
      ]);
    }

    segNames.push(segName);
    onTrimProgress(i + 1);
  }

  // 5. concat demuxer
  onStep("concat");
  const listContent = segNames.map((s) => `file '${s}'`).join("\n");
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listContent));

  await ffmpeg.exec([
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-c", "copy", "-movflags", "+faststart",
    "highlight.mp4",
  ]);

  const output = await ffmpeg.readFile("highlight.mp4");
  const outputBlob = new Blob([output], { type: "video/mp4" });

  // 6. WASM FS 정리
  await ffmpeg.deleteFile("input.mp4").catch(() => {});
  for (const s of segNames) await ffmpeg.deleteFile(s).catch(() => {});
  await ffmpeg.deleteFile("list.txt").catch(() => {});
  await ffmpeg.deleteFile("highlight.mp4").catch(() => {});

  // 7. R2 업로드 (presigned URL)
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

  // 8. DB 레코드 생성
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

  const previewBlobUrl = URL.createObjectURL(outputBlob);
  return { clipId, videoUrl, previewBlobUrl };
}
