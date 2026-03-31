"use client";

import { useState, useCallback } from "react";
import { toBlob as htmlToBlob, toPng } from "html-to-image";

export type ExportStatus = "idle" | "capturing" | "encoding" | "done" | "error";

function getCaptureTarget() {
  const all = document.querySelectorAll<HTMLElement>("[data-capture='card']");
  // 화면에 보이는 요소 우선 (display:none 제외)
  for (const el of all) {
    if (el.offsetParent !== null && el.getBoundingClientRect().width > 0) return el;
  }
  return all[0] ?? null;
}

export function useExportPng() {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const exportPng = useCallback(async () => {
    const el = getCaptureTarget();
    if (!el) return;

    setStatus("capturing");
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        skipAutoScale: true,
      });

      const link = document.createElement("a");
      link.download = `footory-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("done");
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, []);

  return { exportPng, status };
}

export function useExportMp4() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);

  const exportMp4 = useCallback(async () => {
    const el = getCaptureTarget();
    if (!el) return;

    setStatus("capturing");
    setProgress(0);

    try {
      // Capture multiple frames with subtle animation
      const frames: Blob[] = [];
      const totalFrames = 60; // 2 seconds at 30fps
      const cardEl = el as HTMLElement;

      for (let i = 0; i < totalFrames; i++) {
        // Subtle scale animation: 0.95 → 1.0 (ease out)
        const t = i / totalFrames;
        const scale = 0.95 + 0.05 * easeOutCubic(t);
        const opacity = Math.min(1, t * 3); // fade in first third

        cardEl.style.transform = `scale(${scale})`;
        cardEl.style.opacity = `${opacity}`;

        const blob = await htmlToBlob(cardEl, {
          pixelRatio: 2,
          backgroundColor: "#0a0a0c",
          skipAutoScale: true,
        });
        if (blob) frames.push(blob);
        setProgress(Math.round(((i + 1) / totalFrames) * 50));
      }

      // Reset card style
      cardEl.style.transform = "";
      cardEl.style.opacity = "";

      setStatus("encoding");

      // Use ffmpeg.wasm to encode frames to MP4
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      await ffmpeg.load();

      // Write frames
      for (let i = 0; i < frames.length; i++) {
        const frameData = await fetchFile(frames[i]);
        await ffmpeg.writeFile(`frame${String(i).padStart(4, "0")}.png`, frameData);
        setProgress(50 + Math.round(((i + 1) / frames.length) * 40));
      }

      // Encode to MP4
      await ffmpeg.exec([
        "-framerate", "30",
        "-i", "frame%04d.png",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "fast",
        "output.mp4",
      ]);

      setProgress(95);

      const mp4Data = await ffmpeg.readFile("output.mp4");
      const mp4Blob = new Blob([new Uint8Array(mp4Data as Uint8Array)], { type: "video/mp4" });

      const link = document.createElement("a");
      link.download = `footory-card-${Date.now()}.mp4`;
      link.href = URL.createObjectURL(mp4Blob);
      link.click();
      URL.revokeObjectURL(link.href);

      setProgress(100);
      setStatus("done");
    } catch (err) {
      console.error("MP4 export failed:", err);
      setStatus("error");
    } finally {
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 2000);
    }
  }, []);

  return { exportMp4, status, progress };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
