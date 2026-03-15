import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { downloadFromR2, uploadToR2 } from "../r2.js";
import { updateClipRendered } from "../supabase.js";
import { passColor } from "./color.js";
import { passText } from "./text.js";
import { passRing } from "./ring.js";
import { passSlowmo } from "./slowmo.js";
import { passIntro } from "./intro.js";
import { passConcat } from "./concat.js";

interface RenderParams {
  trimStart?: number;
  trimEnd?: number;
  spotlightX?: number;
  spotlightY?: number;
  skillLabels?: string[];
  customLabels?: string[];
  slowmoStart?: number;
  slowmoEnd?: number;
  slowmoSpeed?: number;
  bgmId?: string;
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
 * 멀티패스 렌더 파이프라인
 *
 * Pass 1: 색보정 + 스케일 + 레터박스
 * Pass 2: 텍스트 오버레이 (스킬 라벨, EA FC 카드)
 * Pass 3: 골드 링 오버레이
 * Pass 4: 슬로모션 리플레이 (옵션)
 * Pass 5: 인트로 카드 (옵션)
 * Pass 6: concat (인트로 + 메인 + 슬로모)
 * Pass 7: BGM (Sprint 35에서 추가)
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
    const slowmoOut = join(workDir, "slowmo.mp4");
    const introOut = join(workDir, "intro.mp4");
    const finalOut = join(workDir, "final.mp4");

    // 원본 다운로드
    console.log(`[Render] Downloading ${inputKey}...`);
    await downloadFromR2(inputKey, rawPath);

    // Pass 1: 색보정
    console.log(`[Render] Pass 1: Color correction...`);
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

    // Pass 3: 골드 링
    console.log(`[Render] Pass 3: Ring overlay...`);
    await passRing(pass2Out, pass3Out, {
      spotlightX: params.spotlightX,
      spotlightY: params.spotlightY,
    });

    // 최종 출력 결정 — concat 필요 여부에 따라
    const segments: string[] = [];

    // Pass 5: 인트로 카드 (옵션)
    if (params.effects?.intro !== false && params.playerName) {
      console.log(`[Render] Pass 5: Intro card...`);
      await passIntro(introOut, {
        playerName: params.playerName,
        playerPosition: params.playerPosition,
        playerNumber: params.playerNumber,
      });
      segments.push(introOut);
    }

    // 메인 영상
    segments.push(pass3Out);

    // Pass 4: 슬로모션 (옵션)
    if (
      params.slowmoStart !== undefined &&
      params.slowmoEnd !== undefined &&
      params.slowmoSpeed
    ) {
      console.log(`[Render] Pass 4: Slowmo replay...`);
      await passSlowmo(pass3Out, slowmoOut, {
        slowmoStart: params.slowmoStart,
        slowmoEnd: params.slowmoEnd,
        slowmoSpeed: params.slowmoSpeed,
      });
      segments.push(slowmoOut);
    }

    // Pass 6: concat
    if (segments.length > 1) {
      console.log(`[Render] Pass 6: Concat ${segments.length} segments...`);
      await passConcat(segments, finalOut);
    } else {
      // concat 불필요 — pass3 결과가 최종
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
