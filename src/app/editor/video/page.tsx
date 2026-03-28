"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import type { ClipSegment } from "@/components/editor/video/types";
import VideoPlayer from "@/components/editor/video/VideoPlayer";
import ClipMarker from "@/components/editor/video/ClipMarker";
import ClipTimeline from "@/components/editor/video/ClipTimeline";
import HudConfigPanel from "@/components/editor/video/HudConfigPanel";
import { useEffect } from "react";

// PlayerData → HudPlayerData 변환
function toHudData(card: Record<string, unknown>): HudPlayerData {
  const d = (card.card_data ?? {}) as Record<string, unknown>;
  const positionMap: Record<string, string> = {
    ST: "FW", CF: "FW", LW: "FW", RW: "FW",
    CM: "MF", CAM: "MF", CDM: "MF", LM: "MF", RM: "MF",
    CB: "DF", LB: "DF", RB: "DF", LWB: "DF", RWB: "DF",
    GK: "GK",
  };
  const pos = String(d.position ?? "ST");
  return {
    firstName:    String(d.firstName ?? ""),
    lastName:     String(d.lastName ?? ""),
    number:       String(d.number ?? "9"),
    position:     pos,
    positionShort: positionMap[pos] ?? pos,
    club:          String(d.club ?? ""),
    clubFull:      String(d.club ?? ""),
    age:           String(d.age ?? ""),
    birthDate:     String(d.birthDate ?? ""),
    height:        String(d.height ?? ""),
    weight:        String(d.weight ?? ""),
    foot:          String(d.foot ?? "RIGHT"),
    nationality:   String(d.nationality ?? "KOREA"),
    photoUrl:      String(d.photoUrl ?? ""),
    mainColor:     String(card.main_color ?? d.customClubColor ?? "#C0392B"),
    accentColor:   String(card.accent_color ?? d.customClubAccent ?? "#E74C3C"),
  };
}

export default function VideoEditorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<HudPlayerData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState(false);

  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [seekTo, setSeekTo] = useState<number | undefined>();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hudConfig, setHudConfig] = useState<HudConfig>(DEFAULT_HUD_CONFIG);
  const [showIntro, setShowIntro] = useState(false);

  // Load player card on mount
  useEffect(() => {
    fetch("/api/player-card")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.card) {
          setPlayerData(toHudData(res.card));
        } else {
          setCardError(true);
        }
      })
      .catch(() => setCardError(true))
      .finally(() => setCardLoading(false));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    setVideoSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setClips([]);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handleTimeUpdate = useCallback((t: number, d: number) => {
    setCurrentTime(t);
    setDuration(d);
  }, []);

  const handleAddClip = useCallback((clip: ClipSegment) => {
    setClips((prev) => [...prev, clip]);
    setSelectedClipId(clip.id);
  }, []);

  const handleRemoveClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    setSelectedClipId((prev) => (prev === id ? undefined : prev));
  }, []);

  const handleSelectClip = useCallback((clip: ClipSegment) => {
    setSelectedClipId(clip.id);
    setSeekTo(clip.startTime);
    // seekTo 중복 방지: 잠깐 후 reset
    setTimeout(() => setSeekTo(undefined), 100);
  }, []);

  const handleClipChange = useCallback((updated: ClipSegment) => {
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  // ── 카드 미저장 안내 ──
  if (!cardLoading && cardError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-4xl">⚽</div>
        <h2 className="text-lg font-bold text-white">선수 카드가 없습니다</h2>
        <p className="text-sm text-white/50">
          먼저 선수 프로필 카드를 만들어야 HUD 오버레이를 사용할 수 있습니다.
        </p>
        <button
          onClick={() => router.push("/editor")}
          className="rounded-xl bg-[#D4A853] px-6 py-3 font-bold text-black"
        >
          카드 만들러 가기
        </button>
      </div>
    );
  }

  // ── 영상 미선택 화면 ──
  if (!videoSrc) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-[var(--font-brand)] text-lg font-bold tracking-wider text-white">
            영상 에디터
          </h1>
        </div>

        {/* File drop zone */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div
            className="flex w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/15 p-10 transition-colors hover:border-[#D4A853]/50 hover:bg-[#D4A853]/5"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/6">
              <svg className="h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white/80">경기 영상을 선택하세요</p>
              <p className="mt-1 text-xs text-white/40">MP4, MOV, AVI 등 — 탭하거나 드래그</p>
            </div>
          </div>

          {cardLoading && (
            <p className="text-xs text-white/30">선수 카드 불러오는 중...</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    );
  }

  // ── 메인 에디터 ──
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setVideoSrc(null)} className="text-white/50 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-[var(--font-brand)] text-base font-bold tracking-wider text-white">
            영상 에디터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Intro preview toggle */}
          <button
            onClick={() => setShowIntro((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: showIntro ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.06)",
              color: showIntro ? "#D4A853" : "rgba(255,255,255,0.5)",
              border: `1px solid ${showIntro ? "rgba(212,168,83,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            인트로 미리보기
          </button>
          {/* Clip count badge */}
          {clips.length > 0 && (
            <span className="rounded-full bg-[#D4A853]/20 px-2 py-0.5 text-xs font-bold text-[#D4A853]">
              {clips.length}클립
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {/* Video player */}
          {playerData && (
            <VideoPlayer
              src={videoSrc}
              playerData={playerData}
              onTimeUpdate={handleTimeUpdate}
              seekTo={seekTo}
              hudConfig={hudConfig}
              showIntro={showIntro}
            />
          )}

          {/* HUD config */}
          <HudConfigPanel config={hudConfig} onChange={setHudConfig} />

          {/* Timeline */}
          <div className="rounded-xl bg-white/4 p-3">
            <div className="mb-2 text-xs font-semibold text-white/50 tracking-wide">타임라인</div>
            <ClipTimeline
              duration={duration}
              currentTime={currentTime}
              clips={sortedClips}
              selectedClipId={selectedClipId}
              onSeek={(t) => setSeekTo(t)}
              onClipChange={handleClipChange}
              onSelectClip={(clip) => setSelectedClipId(clip.id)}
            />
          </div>

          {/* Clip marker */}
          <div className="rounded-xl bg-white/4 p-3">
            <div className="mb-3 text-xs font-semibold text-white/50 tracking-wide">클립 마킹</div>
            <ClipMarker
              currentTime={currentTime}
              duration={duration}
              clips={sortedClips}
              onAddClip={handleAddClip}
              onRemoveClip={handleRemoveClip}
              onSelectClip={handleSelectClip}
              selectedClipId={selectedClipId}
            />
          </div>

          {/* 생성 버튼 (추후 서버 렌더링) */}
          {clips.length > 0 && (
            <button
              disabled
              className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-semibold text-white/30 cursor-not-allowed"
            >
              영상 생성 (서버 렌더링 — 준비 중)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
