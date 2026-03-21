import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { downloadFromR2, uploadToR2 } from "../r2.js";
import { updateClipRendered } from "../supabase.js";
import { passColor } from "./color.js";
import { passText } from "./text.js";
import { passRing } from "./ring.js";
import { passIntro } from "./intro.js";
import { passConcat } from "./concat.js";

interface RenderParams {
  trimStart?: number;
  trimEnd?: number;
  spotlightX?: number;
  spotlightY?: number;
  skillLabels?: string[];
  customLabels?: string[];
  playerName?: string;
  playerPosition?: string;
  playerNumber?: number;
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  };
}

interface RenderInput {
  jobId: string;
  clipId: string;
  inputKey: string;
  params: RenderParams;
}

/**
 * 멀티패스 렌더 파이프라인 (4패스)
 *
 * Pass 1: 색보정 + 스케일 + 레터박스 (트림 포함)
 * Pass 2: 텍스트 오버레이 (스킬 라벨, EA FC 카드)
 * Pass 3: 골드 링 / 스포트라이트
 * Pass 4: 인트로 카드 + concat (인트로 있을 때만)
 */
export async function renderClip(input: RenderInput): Promise<string> {
  const { jobId, clipId, inputKey, params } = input;
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const workDir = await mkdtemp(join(tmpdir(), `render-${jobId}-`));

  try {
    const rawPath = join(workDir, "raw.mp4");
    const pass1Out = join(workDir, "pass1.mp4");
    const pass2Out = join(workDir, "pass2.mp4");
    const pass3Out = join(workDir, "pass3.mp4");
    const introOut = join(workDir, "intro.mp4");
    const finalOut = join(workDir, "final.mp4");

    // 원본 다운로드
    console.log(`[Render] Downloading ${inputKey}...`);
    await downloadFromR2(inputKey, rawPath);

    // Pass 1: 색보정 + 트림
    console.log(`[Render] Pass 1: Color + trim...`);
    await passColor(rawPath, pass1Out, {
      trimStart: params.trimStart,
      trimEnd: params.trimEnd,
      colorEnabled: params.effects?.color,
      cinematicEnabled: params.effects?.cinematic,
    });

    // Pass 2: 텍스트 오버레이
    console.log(`[Render] Pass 2: Text overlay...`);
    await passText(pass1Out, pass2Out, {
      skillLabels: params.skillLabels,
      customLabels: params.customLabels,
      playerName: params.playerName,
      playerPosition: params.playerPosition,
      playerNumber: params.playerNumber,
      eafcEnabled: params.effects?.eafc,
    });

    // Pass 3: 골드 링 / 스포트라이트
    console.log(`[Render] Pass 3: Spotlight ring...`);
    await passRing(pass2Out, pass3Out, {
      spotlightX: params.spotlightX,
      spotlightY: params.spotlightY,
    });

    // Pass 4: 인트로 + concat (인트로 활성화 & 선수명 있을 때만)
    const useIntro = params.effects?.intro !== false && !!params.playerName;
    if (useIntro) {
      console.log(`[Render] Pass 4: Intro card + concat...`);
      await passIntro(introOut, {
        playerName: params.playerName!,
        playerPosition: params.playerPosition,
        playerNumber: params.playerNumber,
      });
      await passConcat([introOut, pass3Out], finalOut);
    } else {
      // 인트로 없음 — pass3 결과가 최종
      await passConcat([pass3Out], finalOut);
    }

    // R2 업로드
    const outputKey = inputKey.replace("raw/", "clips/");
    console.log(`[Render] Uploading to ${outputKey}...`);
    await uploadToR2(finalOut, outputKey);

    // clips 테이블 업데이트
    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${outputKey}`
      : outputKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase env not configured");
    }

    await updateClipRendered(supabaseUrl, supabaseKey, clipId, publicUrl, jobId);

    console.log(`[Render] Job ${jobId} completed.`);
    return outputKey;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
