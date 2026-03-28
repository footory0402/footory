"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { HudConfig } from "@/components/video/hud/types";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import type { ClipSegment } from "@/components/editor/video/types";
import VideoPlayer from "@/components/editor/video/VideoPlayer";
import ClipMarker from "@/components/editor/video/ClipMarker";
import ClipTimeline from "@/components/editor/video/ClipTimeline";
import ClipList from "@/components/editor/video/ClipList";
import HudConfigPanel from "@/components/editor/video/HudConfigPanel";
import { buildHudData } from "@/lib/hud-data-builder";

export default function VideoEditorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Player card
  const [playerData, setPlayerData] = useState<HudPlayerData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState(false);

  // Video
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>();
  const [requestPause, setRequestPause] = useState<number | undefined>();

  // Clips
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();

  // HUD
  const [hudConfig, setHudConfig] = useState<HudConfig>(DEFAULT_HUD_CONFIG);
  const [hudVisible, setHudVisible] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Update goal count from clips
  useEffect(() => {
    const goalCount = clips.filter((c) => c.eventTag === "goal").length;
    setHudConfig((prev) => (prev.goalCount !== goalCount ? { ...prev, goalCount } : prev));
  }, [clips]);

  // Load player card
  useEffect(() => {
    fetch("/api/player-card")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.card) {
          setPlayerData(buildHudData(res.card));
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
    setSelectedClipId(undefined);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handleTimeUpdate = useCallback((t: number, d: number) => {
    setCurrentTime(t);
    setDuration(d);
  }, []);

  const handleAddClip = useCallback((clip: ClipSegment) => {
    setClips((prev) => [...prev, clip].sort((a, b) => a.startTime - b.startTime));
    setSelectedClipId(clip.id);
    // Auto-pause on mark
    setRequestPause(Date.now());
  }, []);

  const handleRemoveClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    setSelectedClipId((prev) => (prev === id ? undefined : prev));
  }, []);

  const handleSelectClip = useCallback((clip: ClipSegment) => {
    setSelectedClipId(clip.id);
    setSeekTo(clip.startTime);
    setTimeout(() => setSeekTo(undefined), 100);
  }, []);

  const handleClipChange = useCallback((updated: ClipSegment) => {
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleUpdateClip = useCallback((id: string, updates: Partial<ClipSegment>) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleGenerate = useCallback(() => {
    // TODO: server-side rendering
    alert(`${clips.length}개 클립으로 하이라이트 영상 생성 (서버 렌더링 — 준비 중)`);
  }, [clips.length]);

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
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-brand)] text-lg font-bold tracking-wider text-white">
              영상 에디터
            </h1>
            <span className="rounded bg-[#D4A853]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D4A853]">
              영상 편집
            </span>
          </div>
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
            <div className="text-4xl opacity-30">🎬</div>
            <div className="text-center">
              <p className="font-semibold text-white/80">경기 영상을 드래그하거나 선택하세요</p>
              <p className="mt-1 text-xs text-white/40">MP4, MOV 지원</p>
            </div>
            <div
              className="rounded-lg px-7 py-2.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #C0392B, #E74C3C)" }}
            >
              파일 선택
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
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-brand)] text-base font-bold tracking-wider text-white">
              영상 에디터
            </h1>
            <span className="rounded bg-[#D4A853]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D4A853]">
              영상 편집
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Intro preview */}
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
          {clips.length > 0 && (
            <span className="rounded-full bg-[#D4A853]/20 px-2 py-0.5 text-xs font-bold text-[#D4A853]">
              {clips.length}클립
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[900px] flex-col gap-3 p-4">
          {/* Video player */}
          {playerData && (
            <VideoPlayer
              src={videoSrc}
              playerData={playerData}
              onTimeUpdate={handleTimeUpdate}
              seekTo={seekTo}
              hudConfig={hudConfig}
              hudVisible={hudVisible}
              onHudVisibleChange={setHudVisible}
              showIntro={showIntro}
              requestPause={requestPause}
            />
          )}

          {/* Clip marker (event tags + "여기!" button) */}
          <ClipMarker
            currentTime={currentTime}
            duration={duration}
            clipCount={clips.length}
            onAddClip={handleAddClip}
          />

          {/* Timeline */}
          <div className="rounded-xl border border-white/8 bg-[#111] p-3">
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

          {/* Clip list + generate */}
          <ClipList
            clips={sortedClips}
            selectedClipId={selectedClipId}
            onSelectClip={handleSelectClip}
            onRemoveClip={handleRemoveClip}
            onUpdateClip={handleUpdateClip}
            onGenerate={handleGenerate}
          />

          {/* HUD config (collapsible area) */}
          <HudConfigPanel config={hudConfig} onChange={setHudConfig} />
        </div>
      </div>
    </div>
  );
}
