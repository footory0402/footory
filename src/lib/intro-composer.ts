/**
 * 인트로 카드 + 원본 영상을 ffmpeg.wasm으로 합성합니다.
 * 카드 PNG를 2초간 보여준 후 원본 영상으로 이어집니다.
 *
 * 모바일 제한: SharedArrayBuffer 필요 → COOP/COEP 헤더가 없으면 동작 안 함.
 * 이 경우 합성을 건너뛰고 원본 그대로 업로드합니다.
 */

import { fetchAndRenderCard } from "./card-renderer";

export interface ComposeResult {
  file: File;
  skipped: boolean;
  reason?: string;
}

/**
 * 인트로 카드를 영상 앞에 합성합니다.
 * @param originalFile 원본 영상 파일
 * @param onProgress 진행률 콜백 (0~100)
 * @returns 합성된 파일 또는 원본 (실패 시)
 */
export async function composeIntroCard(
  originalFile: File,
  onProgress?: (pct: number) => void
): Promise<ComposeResult> {
  const report = (pct: number) => onProgress?.(pct);

  // 1. Check SharedArrayBuffer support
  if (typeof SharedArrayBuffer === "undefined") {
    return { file: originalFile, skipped: true, reason: "SharedArrayBuffer 미지원" };
  }

  report(5);

  // 2. Render card to PNG
  const cardBlob = await fetchAndRenderCard();
  if (!cardBlob) {
    return { file: originalFile, skipped: true, reason: "저장된 카드 없음" };
  }

  report(15);

  // 3. Load ffmpeg
  try {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    report(30);

    // 4. Write card image
    const cardData = await fetchFile(cardBlob);
    await ffmpeg.writeFile("card.png", cardData);

    // 5. Write original video
    const videoData = await fetchFile(originalFile);
    await ffmpeg.writeFile("input.mp4", videoData);

    report(50);

    // 6. Create intro video from card image (2 seconds)
    await ffmpeg.exec([
      "-loop", "1",
      "-i", "card.png",
      "-c:v", "libx264",
      "-t", "2",
      "-pix_fmt", "yuv420p",
      "-vf", "scale=720:1040:force_original_aspect_ratio=decrease,pad=720:1040:(ow-iw)/2:(oh-ih)/2:black",
      "-r", "30",
      "intro.mp4",
    ]);

    report(70);

    // 7. Create concat file
    await ffmpeg.writeFile("list.txt",
      new TextEncoder().encode("file 'intro.mp4'\nfile 'input.mp4'\n")
    );

    // 8. Concatenate intro + original
    await ffmpeg.exec([
      "-f", "concat",
      "-safe", "0",
      "-i", "list.txt",
      "-c", "copy",
      "-movflags", "+faststart",
      "output.mp4",
    ]);

    report(90);

    // 9. Read output
    const outputData = await ffmpeg.readFile("output.mp4");
    const outputBlob = new Blob([new Uint8Array(outputData as unknown as ArrayBuffer)], { type: "video/mp4" });
    const outputFile = new File([outputBlob], originalFile.name, { type: "video/mp4" });

    report(100);

    return { file: outputFile, skipped: false };
  } catch (err) {
    console.warn("[IntroComposer] ffmpeg failed, using original:", err);
    return {
      file: originalFile,
      skipped: true,
      reason: `합성 실패: ${(err as Error).message}`,
    };
  }
}
