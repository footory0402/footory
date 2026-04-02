/**
 * 하이라이트 영상 생성기 (클라이언트사이드)
 *
 * [인트로 5초] + [Player Review 5초] + [경기 영상] + [아웃트로 3초]
 * → ffmpeg.wasm으로 concat하여 최종 MP4 생성
 *
 * HUD 오버레이는 Step 4까지는 미포함 (서버사이드 필요).
 * 인트로/리뷰/아웃트로는 Canvas로 프레임 렌더링 후 ffmpeg로 영상화.
 */

import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";

type ProgressCallback = (pct: number) => void;

// ─── Canvas 렌더링 유틸 ───

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── 인트로 카드 Canvas 렌더 (1920x1080) ───

async function renderIntroFrame(
  ctx: CanvasRenderingContext2D,
  data: HudPlayerData,
  W: number,
  H: number,
  playerImg: HTMLImageElement | null
) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, data.mainColor);
  bg.addColorStop(0.4, "#0a0a0a");
  bg.addColorStop(1, data.accentColor + "44");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stadium gradient overlay
  const glow = ctx.createLinearGradient(0, 0, 0, H);
  glow.addColorStop(0, data.mainColor + "44");
  glow.addColorStop(0.5, "transparent");
  glow.addColorStop(1, data.mainColor + "22");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top accent line
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.5, data.accentColor);
  lineGrad.addColorStop(1, "transparent");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, 0, W, 4);

  // Club — top right
  ctx.font = "900 36px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "right";
  ctx.fillText(data.club.replace(/\s*U\d+/, "").toUpperCase(), W - 60, 60);
  ctx.font = "600 14px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText("FOOTBALL CLUB", W - 60, 80);

  // Player photo — left side
  if (playerImg) {
    const imgW = W * 0.4;
    const imgH = H * 0.9;
    ctx.drawImage(playerImg, 60, H - imgH, imgW, imgH);
  }

  // Name — right side
  const nameX = W * 0.5;
  ctx.textAlign = "left";

  // Name (large)
  ctx.font = "900 120px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText((data.name || "PLAYER").toUpperCase(), nameX, H * 0.5);

  // Number (outline)
  ctx.font = "900 160px sans-serif";
  ctx.strokeStyle = data.accentColor;
  ctx.lineWidth = 3;
  ctx.strokeText(data.number || "9", nameX + ctx.measureText((data.name || "PLAYER").toUpperCase()).width + 20, H * 0.5);

  // Info line
  ctx.font = "600 16px sans-serif";
  const infoY = H * 0.65;
  const infoParts = [
    ["NATIONALITY", data.nationality || "KOREA"],
    ["CLUB", data.club],
    ["POSITION", data.position || "FORWARD"],
  ];
  let infoX = nameX;
  for (const [label, value] of infoParts) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(label, infoX, infoY);
    infoX += ctx.measureText(label).width + 8;
    ctx.fillStyle = data.accentColor;
    ctx.fillText(value, infoX, infoY);
    infoX += ctx.measureText(value).width + 20;
    if (infoX < W - 100) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillText("|", infoX - 12, infoY);
    }
  }

  // Signature
  ctx.font = "italic 40px serif";
  ctx.fillStyle = data.accentColor + "66";
  ctx.fillText(data.name || "", nameX, H * 0.78);

  // Club emblem (circle)
  ctx.beginPath();
  ctx.arc(W - 80, H - 60, 30, 0, Math.PI * 2);
  const emblemGrad = ctx.createLinearGradient(W - 110, H - 90, W - 50, H - 30);
  emblemGrad.addColorStop(0, data.mainColor);
  emblemGrad.addColorStop(1, data.accentColor);
  ctx.fillStyle = emblemGrad;
  ctx.fill();
  ctx.font = "700 12px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(data.club.replace(/\s*U\d+/, "").substring(0, 4), W - 80, H - 56);
  ctx.textAlign = "left";

  // Bottom accent line
  const bottomGrad = ctx.createLinearGradient(0, 0, W, 0);
  bottomGrad.addColorStop(0, data.mainColor);
  bottomGrad.addColorStop(0.5, data.accentColor);
  bottomGrad.addColorStop(1, data.mainColor);
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 4, W, 4);
}

// ─── Player Review Canvas 렌더 ───

function renderReviewFrame(
  ctx: CanvasRenderingContext2D,
  data: HudPlayerData,
  W: number,
  H: number,
  playerImg: HTMLImageElement | null,
  progress: number
) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0a0a");
  bg.addColorStop(1, data.mainColor + "44");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent
  ctx.fillStyle = data.mainColor + "33";
  ctx.fillRect(0, 0, W, H * 0.3);

  // Top bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, data.mainColor);
  topGrad.addColorStop(1, data.accentColor);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 4);

  // Club — top right
  ctx.font = "900 28px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "right";
  ctx.fillText(data.club.replace(/\s*U\d+/, "").toUpperCase(), W - 40, 50);
  ctx.font = "600 10px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText("FOOTBALL CLUB", W - 40, 66);
  ctx.textAlign = "left";

  // Player photo — left
  if (playerImg) {
    ctx.drawImage(playerImg, 60, H * 0.15, W * 0.35, H * 0.8);
  }

  // "PLAYER REVIEW" title
  const titleX = W * 0.45;
  ctx.font = "italic 18px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(data.name || "", titleX, 100);

  ctx.font = "900 italic 48px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PLAYER", titleX, 150);
  ctx.fillStyle = data.accentColor;
  ctx.fillText("REVIEW", titleX + ctx.measureText("PLAYER ").width, 150);

  // Review rows
  const rows = [
    ["NAME", data.name || "-"],
    ["NUMBER", data.number],
    ["AGE", data.age || "-"],
    ["DATE OF BIRTH", data.birthDate || "-"],
    ["HEIGHT / WEIGHT", `${data.height || "-"}CM / ${data.weight || "-"}KG`],
    ["FOOT", data.foot],
    ["POSITION", data.position],
    ["CLUB", data.club],
    ["NATIONALITY", data.nationality],
  ];

  const rowH = 38;
  const startY = 200;
  const visibleCount = Math.floor(progress * rows.length);

  for (let i = 0; i < rows.length; i++) {
    const alpha = i < visibleCount ? 1 : Math.max(0, (progress * rows.length - i));
    if (alpha <= 0) continue;

    const y = startY + i * rowH;
    const offsetX = (1 - alpha) * 60;

    ctx.globalAlpha = alpha;

    // Label
    ctx.font = "600 12px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(rows[i][0], titleX + offsetX, y + 24);

    // Value bg
    const valueX = titleX + 200 + offsetX;
    const isEven = i % 2 === 0;
    ctx.fillStyle = isEven ? data.accentColor + "22" : "rgba(255,255,255,0.04)";
    drawRoundedRect(ctx, valueX - 8, y + 8, W - valueX - 40, rowH - 4, 4);
    ctx.fill();

    // Value text
    ctx.font = "700 16px sans-serif";
    ctx.fillStyle = isEven ? data.accentColor : "rgba(255,255,255,0.7)";
    ctx.fillText(rows[i][1], valueX, y + 28);

    ctx.globalAlpha = 1;
  }

  // Club emblem
  ctx.beginPath();
  ctx.arc(W - 60, H - 50, 28, 0, Math.PI * 2);
  const embGrad = ctx.createLinearGradient(W - 88, H - 78, W - 32, H - 22);
  embGrad.addColorStop(0, data.mainColor);
  embGrad.addColorStop(1, data.accentColor);
  ctx.fillStyle = embGrad;
  ctx.fill();
  ctx.font = "700 10px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(data.club.replace(/\s*U\d+/, "").substring(0, 4), W - 60, H - 46);
  ctx.textAlign = "left";
}

// ─── 아웃트로 Canvas 렌더 ───

function renderOutroFrame(ctx: CanvasRenderingContext2D, W: number, H: number, accentColor: string) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);

  // Logo box
  const logoSize = 80;
  const logoX = W / 2 - logoSize / 2 - 100;
  const logoY = H / 2 - logoSize / 2 - 20;
  const grad = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  grad.addColorStop(0, accentColor);
  grad.addColorStop(1, accentColor + "88");
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 16);
  ctx.fill();
  ctx.font = "900 40px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("F", logoX + logoSize / 2, logoY + logoSize / 2 + 14);

  // "Footory" text
  ctx.font = "900 60px sans-serif";
  ctx.fillStyle = accentColor;
  ctx.textAlign = "left";
  ctx.fillText("Foot", logoX + logoSize + 20, H / 2 + 8);
  const footW = ctx.measureText("Foot").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ory", logoX + logoSize + 20 + footW, H / 2 + 8);

  // Tagline
  ctx.font = "600 16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("YOUR FOOTBALL STORY", W / 2, H / 2 + 60);
  ctx.letterSpacing = "0px";

  // CTA button
  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, W / 2 - 70, H / 2 + 100, 140, 36, 18);
  ctx.fill();
  ctx.font = "700 14px sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText("footory.app", W / 2, H / 2 + 122);
  ctx.textAlign = "left";
}

// ─── 메인: 하이라이트 영상 생성 ───

export async function generateHighlightVideo(
  data: HudPlayerData,
  _config: HudConfig,
  videoUrl: string,
  onProgress: ProgressCallback,
  clipId?: string,
): Promise<Blob> {
  if (typeof SharedArrayBuffer === "undefined") {
    throw new Error("SharedArrayBuffer 미지원 — PC Chrome에서 시도해주세요");
  }

  const W = 1920;
  const H = 1080;
  const FPS = 30;
  const INTRO_SEC = 5;
  const REVIEW_SEC = 5;
  const OUTRO_SEC = 3;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Load player image
  let playerImg: HTMLImageElement | null = null;
  if (data.photoUrl) {
    try { playerImg = await loadImage(data.photoUrl); } catch { /* ignore */ }
  }

  onProgress(5);

  // Load ffmpeg
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  onProgress(15);

  // ─── Generate Intro frames ───
  const introFrames = INTRO_SEC * FPS;
  for (let i = 0; i < introFrames; i++) {
    ctx.clearRect(0, 0, W, H);
    renderIntroFrame(ctx, data, W, H, playerImg);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    await ffmpeg.writeFile(`intro${String(i).padStart(4, "0")}.png`, await fetchFile(blob));
    if (i % 15 === 0) onProgress(15 + (i / introFrames) * 10);
  }

  onProgress(25);

  // ─── Generate Review frames (with animation) ───
  const reviewFrames = REVIEW_SEC * FPS;
  for (let i = 0; i < reviewFrames; i++) {
    ctx.clearRect(0, 0, W, H);
    const progress = Math.min(1, (i / reviewFrames) * 1.5); // rows appear in first 2/3
    renderReviewFrame(ctx, data, W, H, playerImg, progress);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    await ffmpeg.writeFile(`review${String(i).padStart(4, "0")}.png`, await fetchFile(blob));
    if (i % 15 === 0) onProgress(25 + (i / reviewFrames) * 10);
  }

  onProgress(35);

  // ─── Generate Outro frames ───
  const outroFrames = OUTRO_SEC * FPS;
  for (let i = 0; i < outroFrames; i++) {
    ctx.clearRect(0, 0, W, H);
    renderOutroFrame(ctx, W, H, data.accentColor);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    await ffmpeg.writeFile(`outro${String(i).padStart(4, "0")}.png`, await fetchFile(blob));
  }

  onProgress(40);

  // ─── Fetch original video ───
  const videoResp = await fetch(videoUrl);
  const videoBlob = await videoResp.blob();
  await ffmpeg.writeFile("highlight.mp4", await fetchFile(videoBlob));

  onProgress(55);

  // ─── Encode intro to mp4 ───
  await ffmpeg.exec([
    "-framerate", String(FPS), "-i", "intro%04d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-preset", "fast", "-crf", "20", "intro.mp4",
  ]);

  onProgress(65);

  // ─── Encode review to mp4 ───
  await ffmpeg.exec([
    "-framerate", String(FPS), "-i", "review%04d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-preset", "fast", "-crf", "20", "review.mp4",
  ]);

  onProgress(75);

  // ─── Encode outro to mp4 ───
  await ffmpeg.exec([
    "-framerate", String(FPS), "-i", "outro%04d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-preset", "fast", "-crf", "20", "outro.mp4",
  ]);

  onProgress(80);

  // ─── Re-encode highlight to matching format ───
  await ffmpeg.exec([
    "-i", "highlight.mp4",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-vf", `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`,
    "-preset", "fast", "-crf", "20", "-an", "highlight_norm.mp4",
  ]);

  onProgress(88);

  // ─── Concat all parts ───
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(
    "file 'intro.mp4'\nfile 'review.mp4'\nfile 'highlight_norm.mp4'\nfile 'outro.mp4'\n"
  ));

  await ffmpeg.exec([
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-c", "copy", "-movflags", "+faststart", "final.mp4",
  ]);

  onProgress(92);

  // ─── Read final video ───
  const finalData = await ffmpeg.readFile("final.mp4");
  const finalBlob = new Blob([new Uint8Array(finalData as unknown as ArrayBuffer)], { type: "video/mp4" });

  // ─── Upload to R2 via presigned URL ───
  if (clipId) {
    onProgress(94);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "video/mp4",
          fileName: `highlight-${clipId}.mp4`,
          fileSize: finalBlob.size,
          clipId,
          prefix: "highlights",
        }),
      });

      if (presignRes.ok) {
        const { url: uploadUrl, key } = await presignRes.json();
        onProgress(96);

        // Upload to R2
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4" },
          body: finalBlob,
        });

        onProgress(98);

        // Update clip video_url with highlight version
        const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
        const highlightUrl = `${r2Url}/${key}`;

        await fetch(`/api/clips/${clipId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_url: highlightUrl }),
        });
      }
    } catch (err) {
      console.warn("[Highlight] R2 upload failed, falling back to download:", err);
      // Fallback: download locally
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `footory-highlight-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  onProgress(100);
  return finalBlob;
}
