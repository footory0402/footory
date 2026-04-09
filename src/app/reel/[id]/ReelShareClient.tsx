"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { PlayableClip } from "@/components/player/ClipPlayerSheet";

const ClipPlayerSheet = dynamic(() => import("@/components/player/ClipPlayerSheet"), { ssr: false });

interface Clip {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  memo: string | null;
  durationSeconds: number | null;
  spotlightX: number | null;
  spotlightY: number | null;
  freezeAt: number | null;
  trimStart: number | null;
  trimEnd: number | null;
  slowmoStart: number | null;
  slowmoEnd: number | null;
  slowmoSpeed: number | null;
  bgmId: string | null;
  effects: Record<string, unknown> | null;
  playerName: string;
  playerPosition: string | null;
  playerBirthYear: number | null;
  teamName?: string | null;
}

interface Props {
  clips: Clip[];
  profileHandle: string;
}

export default function ReelShareClient({ clips, profileHandle }: Props) {
  const [playing, setPlaying] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const playableClips: PlayableClip[] = clips.map((c) => ({
    id: c.id,
    videoUrl: c.videoUrl,
    thumbnailUrl: c.thumbnailUrl,
    duration: c.durationSeconds,
    spotlightX: c.spotlightX,
    spotlightY: c.spotlightY,
    freezeAt: c.freezeAt,
    trimStart: c.trimStart,
    trimEnd: c.trimEnd,
    slowmoStart: c.slowmoStart,
    slowmoEnd: c.slowmoEnd,
    slowmoSpeed: c.slowmoSpeed,
    bgmId: c.bgmId,
    effects: c.effects as PlayableClip["effects"],
    playerName: c.playerName,
    playerPosition: c.playerPosition,
    playerBirthYear: c.playerBirthYear ?? undefined,
    teamName: c.teamName ?? undefined,
  }));

  return (
    <div className="flex flex-1 flex-col">
      {/* 클립 목록 */}
      <div className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3" style={{ maxWidth: 500, margin: "0 auto" }}>
          {clips.map((clip, i) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => { setStartIndex(i); setPlaying(true); }}
              className="relative w-full overflow-hidden text-left"
              style={{ borderRadius: 12, background: "var(--color-card)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
            >
              <div className="flex items-center gap-3 p-3">
                {/* 썸네일 */}
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{ width: 80, height: 52, borderRadius: 8, background: "#111" }}
                >
                  {clip.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.thumbnailUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {/* 플레이 오버레이 */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>▶</span>
                  </div>
                </div>

                {/* 정보 */}
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-text-1)", margin: 0 }}>
                    {clip.memo ?? `클립 ${i + 1}`}
                  </p>
                  {clip.durationSeconds != null && (
                    <p style={{ fontFamily: "var(--font-stat)", fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>
                      {Math.floor(clip.durationSeconds / 60)}:{String(Math.round(clip.durationSeconds % 60)).padStart(2, "0")}
                    </p>
                  )}
                </div>

                {/* 인덱스 */}
                <div
                  className="shrink-0"
                  style={{ fontFamily: "var(--font-stat)", fontSize: 11, color: "var(--color-text-3)" }}
                >
                  {i + 1} / {clips.length}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 전체 재생 버튼 */}
      <div className="px-4" style={{ maxWidth: 500, margin: "0 auto", width: "100%", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px) + 60px)" }}>
        <button
          type="button"
          onClick={() => { setStartIndex(0); setPlaying(true); }}
          className="flex w-full items-center justify-center gap-2"
          style={{ height: 52, borderRadius: 14, background: "var(--color-accent)", color: "#000", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          <span style={{ fontSize: 16 }}>▶</span>
          전체 재생 · {clips.length}개 클립
        </button>
      </div>

      {/* 플레이어 */}
      {playing && (
        <ClipPlayerSheet
          clips={playableClips}
          initialIndex={startIndex}
          onClose={() => setPlaying(false)}
          onShare={() => {
            if (navigator.share) {
              navigator.share({ url: window.location.href }).catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}
