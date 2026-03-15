import { execFile } from "child_process";
import { promisify } from "util";
import { OUTPUT_W, CODEC, PRESET, CRF, AUDIO_CODEC, AUDIO_BITRATE } from "./config";

const exec = promisify(execFile);

const FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc";

interface SlowmoParams {
  slowmoStart: number;
  slowmoEnd: number;
  slowmoSpeed: number; // 0.5, 0.3, 0.25
}

/**
 * Pass 4: 슬로모션 리플레이 구간 생성
 * 메인 영상에서 slowmo 구간만 추출 → setpts로 속도 조절 → REPLAY 뱃지
 *
 * atempo 체인: 범위 0.5-2.0 제한
 * 0.5x → atempo=0.5 (범위 내)
 * 0.3x → atempo=0.5,atempo=0.6
 * 0.25x → atempo=0.5,atempo=0.5
 */
export async function passSlowmo(
  inputPath: string,
  outputPath: string,
  params: SlowmoParams
): Promise<void> {
  const { slowmoStart, slowmoEnd, slowmoSpeed } = params;

  // setpts = 1/speed (0.5x → 2.0, 0.3x → 3.33, 0.25x → 4.0)
  const ptsFactor = (1 / slowmoSpeed).toFixed(4);

  // atempo 체인 계산
  const atempoFilters = buildAtempoChain(slowmoSpeed);

  const videoFilter = [
    `setpts=${ptsFactor}*PTS`,
    // REPLAY 뱃지 (우상단)
    `drawtext=fontfile='${FONT}':text='REPLAY':` +
      `fontcolor=0x7F77DD:fontsize=20:x=${OUTPUT_W}-tw-30:y=55:` +
      `borderw=2:bordercolor=0x000000`,
  ].join(",");

  const args = [
    "-y",
    "-i", inputPath,
    "-ss", String(slowmoStart),
    "-to", String(slowmoEnd),
    "-vf", videoFilter,
    "-af", atempoFilters,
    "-c:v", CODEC, "-preset", PRESET, "-crf", CRF,
    "-c:a", AUDIO_CODEC, "-b:a", AUDIO_BITRATE,
    "-movflags", "+faststart",
    outputPath,
  ];

  await exec("ffmpeg", args, { timeout: 180_000 });
}

function buildAtempoChain(speed: number): string {
  // atempo는 0.5~2.0 범위 제한
  const factors: number[] = [];
  let remaining = speed;

  while (remaining < 0.5) {
    factors.push(0.5);
    remaining = remaining / 0.5;
  }
  factors.push(remaining);

  return factors.map((f) => `atempo=${f.toFixed(4)}`).join(",");
}
