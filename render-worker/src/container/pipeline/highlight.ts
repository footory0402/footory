import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { downloadFromR2, uploadToR2 } from "../r2.js";
import { passIntro } from "./intro.js";
import { passConcat } from "./concat.js";
import { passBgm, downloadBgm } from "./bgm.js";

interface HighlightRenderInput {
  jobId: string;
  highlightId: string;
  clipKeys: string[]; // rendered clips R2 keys
  playerName: string;
  playerPosition?: string;
  bgmR2Key?: string;
}

/**
 * 하이라이트 릴 렌더
 * 인트로 → 클립들 concat → BGM(옵션) → 아웃트로(없음, 향후)
 */
export async function renderHighlight(
  input: HighlightRenderInput
): Promise<string> {
  const { jobId, highlightId, clipKeys, playerName, playerPosition, bgmR2Key } =
    input;

  const workDir = await mkdtemp(join(tmpdir(), `highlight-${jobId}-`));

  try {
    const segments: string[] = [];

    // 인트로
    const introPath = join(workDir, "intro.mp4");
    await passIntro(introPath, { playerName, playerPosition });
    segments.push(introPath);

    // 클립 다운로드
    for (let i = 0; i < clipKeys.length; i++) {
      const localPath = join(workDir, `clip_${i}.mp4`);
      console.log(`[Highlight] Downloading clip ${i + 1}/${clipKeys.length}...`);
      await downloadFromR2(clipKeys[i], localPath);
      segments.push(localPath);
    }

    // Concat
    const concatPath = join(workDir, "concat.mp4");
    console.log(`[Highlight] Concatenating ${segments.length} segments...`);
    await passConcat(segments, concatPath);

    // BGM (옵션)
    let finalPath = concatPath;
    if (bgmR2Key) {
      const bgmPath = join(workDir, "bgm.mp3");
      await downloadBgm(bgmR2Key, bgmPath);

      finalPath = join(workDir, "final.mp4");
      await passBgm(concatPath, bgmPath, finalPath, {
        bgmR2Key,
        originalVolume: 0.5,
        bgmVolume: 0.5,
      });
    }

    // R2 업로드
    const outputKey = `highlights/${highlightId}.mp4`;
    console.log(`[Highlight] Uploading to ${outputKey}...`);
    await uploadToR2(finalPath, outputKey);

    return outputKey;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
