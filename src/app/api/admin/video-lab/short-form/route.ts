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
  buildShortFormCopy,
  getShortFormPresetConfig,
  SHORT_FORM_PRESETS,
  SHORT_FORM_TAGS,
  type ShortFormPreset,
  type ShortFormTag,
} from "@/lib/video-lab";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 100 * 1024 * 1024;
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
  const requestedPreset = String(formData.get("preset") ?? "clean");
  const requestedTag = String(formData.get("tag") ?? "슈팅");
  const preset = SHORT_FORM_PRESETS.some((item) => item.id === requestedPreset)
    ? (requestedPreset as ShortFormPreset)
    : "clean";
  const tag = SHORT_FORM_TAGS.includes(requestedTag as ShortFormTag)
    ? (requestedTag as ShortFormTag)
    : "슈팅";
  const playerName = String(formData.get("playerName") ?? "FOOTORY PLAYER").trim() || "FOOTORY PLAYER";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "video file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "video files only" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "file must be 100MB or smaller" }, { status: 400 });
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "footory-video-lab-"));
  const id = randomUUID();
  const ext = VIDEO_EXTENSIONS.get(file.type) ?? ".mp4";
  const inputPath = path.join(tempDir, `input${ext}`);
  const outputPath = path.join(tempDir, "output.mp4");
  const overlaySvgPath = path.join(tempDir, "overlay.svg");
  const overlayPngPath = path.join(tempDir, "overlay.png");
  const startedAt = Date.now();

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(inputPath, bytes);

    const probe = await probeMedia(inputPath);
    const targetDuration = Math.max(2, Math.min(probe.durationSeconds || 12, 18));
    const copy = buildShortFormCopy(playerName, tag, preset);
    const presetConfig = getShortFormPresetConfig(preset);
    await fs.writeFile(
      overlaySvgPath,
      buildOverlaySvg({
        accent: presetConfig.accent,
        badge: copy.badge,
        headline: copy.headline,
        caption: copy.caption,
        bgmLabel: copy.bgmLabel,
      }),
      "utf8"
    );
    await runCommand("sips", ["-s", "format", "png", overlaySvgPath, "--out", overlayPngPath]);

    await renderShortForm({
      inputPath,
      outputPath,
      overlayPath: overlayPngPath,
      preset,
      probe,
      targetDuration,
    });

    const outputBytes = new Uint8Array(await fs.readFile(outputPath));
    const outputKey = `poc/video-lab/${user.id}/${id}.mp4`;
    await putObjectToR2(outputKey, outputBytes, "video/mp4");

    return NextResponse.json({
      result: {
        outputUrl: getPublicVideoUrl(outputKey),
        durationSeconds: targetDuration,
        renderMs: Date.now() - startedAt,
        headline: copy.headline,
        caption: copy.caption,
        badge: copy.badge,
        bgmLabel: copy.bgmLabel,
        bgmHint: copy.bgmHint,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function renderShortForm({
  inputPath,
  outputPath,
  overlayPath,
  preset,
  probe,
  targetDuration,
}: {
  inputPath: string;
  outputPath: string;
  overlayPath: string;
  preset: ShortFormPreset;
  probe: ProbeData;
  targetDuration: number;
}) {
  const fadeOutStart = Math.max(targetDuration - 1.0, 0);

  const videoFilter = [
    `[0:v]trim=start=0:end=${targetDuration},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:6[bg]`,
    `[0:v]trim=start=0:end=${targetDuration},setpts=PTS-STARTPTS,scale=940:1500:force_original_aspect_ratio=decrease[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2-28[base]`,
    `[base][1:v]overlay=0:0[vout]`,
  ].join(";");

  const synthInput = buildSynthInput(preset);
  const audioFilter = probe.hasAudio
    ? [
        `[0:a]atrim=start=0:end=${targetDuration},asetpts=PTS-STARTPTS,volume=0.82[a0]`,
        `[2:a]volume=0.12,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=1.0[a1]`,
        `[a0][a1]amix=inputs=2:normalize=0[aout]`,
      ].join(";")
    : [
        `[2:a]volume=0.18,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=1.0[aout]`,
      ].join(";");

  const filterComplex = `${videoFilter};${audioFilter}`;

  const args = [
    "-y",
    "-i",
    inputPath,
    "-loop",
    "1",
    "-t",
    `${targetDuration}`,
    "-i",
    overlayPath,
    "-f",
    "lavfi",
    "-t",
    `${targetDuration}`,
    "-i",
    synthInput,
    "-filter_complex",
    filterComplex,
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

function buildSynthInput(preset: ShortFormPreset): string {
  const expressions: Record<ShortFormPreset, string> = {
    clean:
      "aevalsrc=0.14*sin(2*PI*220*t)+0.08*sin(2*PI*330*t)+0.05*sin(2*PI*440*t):s=44100",
    pulse:
      "aevalsrc=0.16*sin(2*PI*180*t)+0.12*sin(2*PI*270*t)+0.06*sin(2*PI*540*t):s=44100",
    cinema:
      "aevalsrc=0.18*sin(2*PI*130*t)+0.10*sin(2*PI*195*t)+0.06*sin(2*PI*260*t):s=44100",
  };

  return expressions[preset] ?? expressions.clean;
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

  const durationSeconds = Number(parsed.format?.duration ?? 0);
  const hasAudio = Boolean(parsed.streams?.some((stream) => stream.codec_type === "audio"));

  return { durationSeconds, hasAudio };
}

function buildOverlaySvg({
  accent,
  badge,
  headline,
  caption,
  bgmLabel,
}: {
  accent: string;
  badge: string;
  headline: string;
  caption: string;
  bgmLabel: string;
}): string {
  const safeAccent = accent;
  const safeBadge = escapeXml(badge);
  const safeHeadline = escapeXml(headline);
  const safeCaption = escapeXml(caption);
  const safeBgmLabel = escapeXml(bgmLabel);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="footerFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${safeAccent}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${safeAccent}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>

  <rect x="48" y="56" width="984" height="184" rx="20" fill="${safeAccent}" fill-opacity="0.18"/>
  <rect x="48" y="1656" width="984" height="216" rx="24" fill="#161618" fill-opacity="0.72"/>
  <rect x="48" y="1656" width="984" height="216" rx="24" fill="url(#footerFade)"/>

  <text x="84" y="108" fill="#D4A853" font-size="24" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif"
    letter-spacing="3">
    INTERNAL SHORT-FORM POC
  </text>
  <text x="84" y="158" fill="#FAFAFA" font-size="34" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    ${safeBadge}
  </text>
  <text x="84" y="206" fill="#FAFAFA" font-size="72" font-weight="700"
    font-family="Rajdhani, Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    ${safeHeadline}
  </text>

  <text x="84" y="1730" fill="#FAFAFA" font-size="54" font-weight="700"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    ${safeCaption}
  </text>
  <text x="84" y="1794" fill="#A1A1AA" font-size="28" font-weight="500"
    font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Arial Unicode MS, sans-serif">
    추천 사운드 · ${safeBgmLabel}
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

      const message = stderr.trim() || `${command} exited with code ${code}`;
      reject(new Error(message));
    });
  });
}
