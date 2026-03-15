import { execFile } from "child_process";
import { promisify } from "util";
import { OUTPUT_W, OUTPUT_H, CODEC, PRESET, CRF } from "./config";

const exec = promisify(execFile);

const FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc";
const GOLD = "0xD4A853";

interface TextParams {
  skillLabels?: string[];
  customLabels?: string[];
  playerName?: string;
  playerPosition?: string;
  playerNumber?: number;
  eafcEnabled?: boolean;
}

/**
 * Pass 2: 텍스트 오버레이
 * - 스킬 라벨 (좌상단, 0-2초)
 * - 타임스탬프 (우하단, 항상)
 * - EA FC 카드 (좌하단, 0-3초)
 * - 네임태그 (중앙 상단, 0-2초)
 */
export async function passText(
  inputPath: string,
  outputPath: string,
  params: TextParams
): Promise<void> {
  const filters: string[] = [];

  // 스킬 라벨 (좌상단)
  const labels = [
    ...(params.skillLabels ?? []),
    ...(params.customLabels ?? []),
  ];
  if (labels.length > 0) {
    const labelText = labels.join(" / ");
    filters.push(
      `drawtext=fontfile='${FONT}':text='${escapeFfmpeg(labelText)}':` +
        `fontcolor=${GOLD}:fontsize=22:x=30:y=55:` +
        `enable='between(t\\,0.3\\,2.5)'`
    );
  }

  // 타임스탬프 (우하단)
  filters.push(
    `drawtext=fontfile='${FONT}':text='%{pts\\:hms}':` +
      `fontcolor=0xFFFFFF@0.6:fontsize=16:x=${OUTPUT_W}-tw-30:y=${OUTPUT_H}-60`
  );

  // EA FC 스타일 카드 (좌하단)
  if (params.eafcEnabled !== false && params.playerName) {
    // 배경 박스
    filters.push(
      `drawbox=x=20:y=${OUTPUT_H - 110}:w=240:h=70:color=0x0C0C0E:t=fill:` +
        `enable='between(t\\,0\\,3)'`
    );
    // 이름
    filters.push(
      `drawtext=fontfile='${FONT}':text='${escapeFfmpeg(params.playerName)}':` +
        `fontcolor=0xFFFFFF:fontsize=20:x=35:y=${OUTPUT_H - 100}:` +
        `enable='between(t\\,0\\,3)'`
    );
    // 포지션
    if (params.playerPosition) {
      filters.push(
        `drawtext=fontfile='${FONT}':text='${params.playerPosition}':` +
          `fontcolor=${GOLD}:fontsize=14:x=35:y=${OUTPUT_H - 70}:` +
          `enable='between(t\\,0\\,3)'`
      );
    }
  }

  if (filters.length === 0) {
    // 텍스트 없으면 복사만
    const args = ["-y", "-i", inputPath, "-c", "copy", outputPath];
    await exec("ffmpeg", args, { timeout: 120_000 });
    return;
  }

  const args = [
    "-y", "-i", inputPath,
    "-vf", filters.join(","),
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    "-c:a", "copy",
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 120_000 });
}

function escapeFfmpeg(text: string): string {
  return text
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\\/g, "\\\\");
}
