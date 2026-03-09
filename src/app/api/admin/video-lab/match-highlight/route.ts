import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicVideoUrl, putObjectToR2 } from "@/lib/r2";
import { isPocAdminUser } from "@/lib/poc-admin";
import {
  buildMatchHighlightCopy,
  formatTimestamp,
  getMatchHighlightPresetConfig,
  MATCH_HIGHLIGHT_PRESETS,
  parseMatchRanges,
  type MatchHighlightPreset,
} from "@/lib/video-lab";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 300 * 1024 * 1024;
const MAX_RANGE_COUNT = 8;
const MAX_TOTAL_DURATION = 90;
const VIDEO_EXTENSIONS = new Map([
  ["video/mp4", ".mp4"],
  ["video/quicktime", ".mov"],
  ["video/x-matroska", ".mkv"],
  ["video/webm", ".webm"],
]);

type ProbeData = {
  durationSeconds: number;
  hasAudio: boolean;
};

type MatchRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPocAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("video");
  const playerName = String(formData.get("playerName") ?? "FOOTORY PLAYER").trim() || "FOOTORY PLAYER";
  const rawRanges = String(formData.get("ranges") ?? "").trim();
  const requestedPreset = String(formData.get("preset") ?? "focus");
  const preset = MATCH_HIGHLIGHT_PRESETS.some((item) => item.id === requestedPreset)
    ? (requestedPreset as MatchHighlightPreset)
    : "focus";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "video file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "video files only" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "full-match POC is capped at 300MB" }, { status: 400 });
  }

  let parsedRanges: MatchRange[];
  try {
    parsedRanges = parseMatchRanges(rawRanges);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "range parsing failed" },
      { status: 400 }
    );
  }

  if (parsedRanges.length === 0) {
    return NextResponse.json({ error: "최소 1개 이상의 range가 필요해요." }, { status: 400 });
  }

  if (parsedRanges.length > MAX_RANGE_COUNT) {
    return NextResponse.json(
      { error: `range는 최대 ${MAX_RANGE_COUNT}개까지 지원합니다.` },
      { status: 400 }
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "footory-match-lab-"));
  const id = randomUUID();
  const ext = VIDEO_EXTENSIONS.get(file.type) ?? ".mp4";
  const inputPath = path.join(tempDir, `input${ext}`);
  const overlaySvgPath = path.join(tempDir, "overlay.svg");
  const overlayPngPath = path.join(tempDir, "overlay.png");
  const outputPath = path.join(tempDir, "output.mp4");
  const startedAt = Date.now();

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(inputPath, bytes);

    const probe = await probeMedia(inputPath);
    const ranges = validateRanges(parsedRanges, probe.durationSeconds);
    const totalDuration = ranges.reduce((sum, range) => sum + (range.endSeconds - range.startSeconds), 0);

    if (totalDuration > MAX_TOTAL_DURATION) {
      return NextResponse.json(
        { error: `선택 구간 총 길이는 ${MAX_TOTAL_DURATION}초 이하여야 해요.` },
        { status: 400 }
      );
    }

    const copy = buildMatchHighlightCopy(playerName, preset, ranges.length);
    const presetConfig = getMatchHighlightPresetConfig(preset);

    await fs.writeFile(
      overlaySvgPath,
      buildMatchOverlaySvg({
        accent: presetConfig.accent,
        title: copy.title,
        subtitle: copy.subtitle,
        bgmLabel: copy.bgmLabel,
        rangeSummary: ranges.map((range) => range.label).join(" · "),
      }),
      "utf8"
    );
    await runCommand("sips", ["-s", "format", "png", overlaySvgPath, "--out", overlayPngPath]);

    await renderMatchHighlight({
      inputPath,
      overlayPath: overlayPngPath,
      outputPath,
      preset,
      probe,
      ranges,
      totalDuration,
    });

    const outputBytes = new Uint8Array(await fs.readFile(outputPath));
    const outputKey = `poc/video-lab/${user.id}/${id}-match.mp4`;
    await putObjectToR2(outputKey, outputBytes, "video/mp4");

    return NextResponse.json({
      result: {
        outputUrl: getPublicVideoUrl(outputKey),
        durationSeconds: totalDuration,
        renderMs: Date.now() - startedAt,
        title: copy.title,
        subtitle: copy.subtitle,
        bgmLabel: copy.bgmLabel,
        rangeCount: ranges.length,
        rangeLabels: ranges.map((range) => range.label),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Match render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function validateRanges(ranges: MatchRange[], durationSeconds: number): MatchRange[] {
  return ranges.map((range) => {
    if (range.startSeconds >= durationSeconds || range.endSeconds > durationSeconds) {
      throw new Error(
        `영상 길이(${formatTimestamp(durationSeconds)})를 넘어가는 range가 있습니다: ${range.label}`
      );
    }

    return range;
  });
}

async function renderMatchHighlight({
  inputPath,
  overlayPath,
  outputPath,
  preset,
  probe,
  ranges,
  totalDuration,
}: {
  inputPath: string;
  overlayPath: string;
  outputPath: string;
  preset: MatchHighlightPreset;
  probe: ProbeData;
  ranges: MatchRange[];
  totalDuration: number;
}) {
  const fadeOutStart = Math.max(totalDuration - 1.2, 0);
  const segmentFilters: string[] = [];
  const concatInputs: string[] = [];

  ranges.forEach((range, index) => {
    segmentFilters.push(
      `[0:v]trim=start=${range.startSeconds}:end=${range.endSeconds},setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080[v${index}]`
    );

    if (probe.hasAudio) {
      segmentFilters.push(
        `[0:a]atrim=start=${range.startSeconds}:end=${range.endSeconds},asetpts=PTS-STARTPTS[a${index}]`
      );
    }

    concatInputs.push(`[v${index}]`);
    if (probe.hasAudio) {
      concatInputs.push(`[a${index}]`);
    }
  });

  const concatFilter = probe.hasAudio
    ? `${concatInputs.join("")}concat=n=${ranges.length}:v=1:a=1[vcat][acat]`
    : `${concatInputs.join("")}concat=n=${ranges.length}:v=1:a=0[vcat]`;

  const videoFilter = [
    ...segmentFilters,
    concatFilter,
    `[vcat][1:v]overlay=0:0[vout]`,
  ].join(";");

  const synthInput = buildMatchSynthInput(preset);
  const audioFilter = probe.hasAudio
    ? [
        `[acat]volume=0.86[a0]`,
        `[2:a]volume=0.12,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=1.2[a1]`,
        `[a0][a1]amix=inputs=2:normalize=0[aout]`,
      ].join(";")
    : `[2:a]volume=0.18,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=1.2[aout]`;

  const args = [
    "-y",
    "-i",
    inputPath,
    "-loop",
    "1",
    "-t",
    `${totalDuration}`,
    "-i",
    overlayPath,
    "-f",
    "lavfi",
    "-t",
    `${totalDuration}`,
    "-i",
    synthInput,
    "-filter_complex",
    `${videoFilter};${audioFilter}`,
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-shortest",
    outputPath,
  ];

  await runCommand("ffmpeg", args);
}

function buildMatchSynthInput(preset: MatchHighlightPreset): string {
  const expressions: Record<MatchHighlightPreset, string> = {
    focus:
      "aevalsrc=0.12*sin(2*PI*150*t)+0.08*sin(2*PI*225*t)+0.05*sin(2*PI*300*t):s=44100",
    tempo:
      "aevalsrc=0.15*sin(2*PI*190*t)+0.11*sin(2*PI*285*t)+0.07*sin(2*PI*380*t):s=44100",
    recap:
      "aevalsrc=0.14*sin(2*PI*130*t)+0.10*sin(2*PI*260*t)+0.06*sin(2*PI*390*t):s=44100",
  };

  return expressions[preset] ?? expressions.focus;
}

async function probeMedia(filePath: string): Promise<ProbeData> {
  const output = await runCommand("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const parsed = JSON.parse(output) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string }>;
  };

  return {
    durationSeconds: Number(parsed.format?.duration ?? 0),
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === "audio")),
  };
}

function buildMatchOverlaySvg({
  accent,
  title,
  subtitle,
  bgmLabel,
  rangeSummary,
}: {
  accent: string;
  title: string;
  subtitle: string;
  bgmLabel: string;
  rangeSummary: string;
}) {
  const safeAccent = accent;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect x="44" y="40" width="1832" height="136" rx="18" fill="#161618" fill-opacity="0.78"/>
  <rect x="44" y="904" width="1832" height="136" rx="18" fill="#161618" fill-opacity="0.78"/>
  <rect x="44" y="40" width="10" height="136" rx="5" fill="${safeAccent}"/>
  <rect x="44" y="904" width="10" height="136" rx="5" fill="${safeAccent}"/>

  <text x="86" y="92" fill="${safeAccent}" font-size="28" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif"
    letter-spacing="2.4">
    INTERNAL MATCH LAB
  </text>
  <text x="86" y="144" fill="#FAFAFA" font-size="60" font-weight="700"
    font-family="Rajdhani, Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    ${escapeXml(title)}
  </text>
  <text x="86" y="990" fill="#FAFAFA" font-size="34" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    ${escapeXml(subtitle)}
  </text>
  <text x="86" y="1028" fill="#A1A1AA" font-size="24" font-weight="500"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    구간 · ${escapeXml(rangeSummary)}
  </text>
  <text x="1560" y="1028" fill="${safeAccent}" font-size="26" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif" text-anchor="end">
    추천 사운드 · ${escapeXml(bgmLabel)}
  </text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });
}
