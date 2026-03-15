import { execFile } from "child_process";
import { promisify } from "util";
import { OUTPUT_W, OUTPUT_H, CODEC, PRESET, CRF, AUDIO_CODEC, AUDIO_BITRATE } from "./config";

const exec = promisify(execFile);

const FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc";
const GOLD = "0xD4A853";

interface IntroParams {
  playerName: string;
  playerPosition?: string;
  playerNumber?: number;
}

/**
 * Pass 5: 인트로 카드 (2초)
 * 검정 배경 + 골드 텍스트 (이름, 포지션)
 */
export async function passIntro(
  outputPath: string,
  params: IntroParams
): Promise<void> {
  const filters = [
    // 2초 검정 배경
    `color=c=0x0C0C0E:s=${OUTPUT_W}x${OUTPUT_H}:d=2`,
  ];

  const textFilters = [
    // 선수 이름 (중앙)
    `drawtext=fontfile='${FONT}':text='${escapeFfmpeg(params.playerName)}':` +
      `fontcolor=${GOLD}:fontsize=38:x=(${OUTPUT_W}-tw)/2:y=${Math.round(OUTPUT_H * 0.44)}`,
  ];

  if (params.playerPosition) {
    textFilters.push(
      `drawtext=fontfile='${FONT}':text='${params.playerPosition}':` +
        `fontcolor=0xA1A1AA:fontsize=22:x=(${OUTPUT_W}-tw)/2:y=${Math.round(OUTPUT_H * 0.51)}`
    );
  }

  const args = [
    "-y",
    "-f", "lavfi",
    "-i", filters[0],
    "-vf", textFilters.join(","),
    "-t", "2",
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    // 무음 오디오 트랙 추가 (concat 호환)
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
    "-shortest",
    "-c:a", AUDIO_CODEC, "-b:a", AUDIO_BITRATE,
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 60_000 });
}

function escapeFfmpeg(text: string): string {
  return text
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\\/g, "\\\\");
}
