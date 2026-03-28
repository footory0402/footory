"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { HudConfig } from "@/components/video/hud/types";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import type { ClipSegment, EventTag } from "@/components/editor/video/types";
import VideoPlayer from "@/components/editor/video/VideoPlayer";
import ClipTimeline from "@/components/editor/video/ClipTimeline";
import { EVENTS, EVENT_TAG_COLORS, MIN_CLIP_DURATION } from "@/components/editor/video/types";
import { buildHudData } from "@/lib/hud-data-builder";

export default function VideoEditorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Player card
  const [playerData, setPlayerData] = useState<HudPlayerData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);

  // Video
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>();
  const [requestPause, setRequestPause] = useState<number | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);

  // Clips
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();

  // HUD
  const [hudConfig, setHudConfig] = useState<HudConfig>(DEFAULT_HUD_CONFIG);

  // Guide
  const [showGuide, setShowGuide] = useState(true);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    const goalCount = clips.filter((c) => c.eventTag === "goal").length;
    setHudConfig((prev) => (prev.goalCount !== goalCount ? { ...prev, goalCount } : prev));
  }, [clips]);

  useEffect(() => {
    fetch("/api/player-card")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => { if (res?.card) setPlayerData(buildHudData(res.card)); })
      .catch(() => {})
      .finally(() => setCardLoading(false));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    setVideoSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    setClips([]); setSelectedClipId(undefined); setCurrentTime(0); setDuration(0);
  }, []);

  const handleTimeUpdate = useCallback((t: number, d: number) => {
    setCurrentTime(t); setDuration(d);
  }, []);

  const handleMark = useCallback(() => {
    if (duration === 0 || clips.length >= 10) return;
    const clipLen = Math.min(10, Math.max(MIN_CLIP_DURATION, duration * 0.5));
    const half = clipLen / 2;
    const clip: ClipSegment = {
      id: crypto.randomUUID(),
      startTime: Math.max(0, currentTime - half),
      endTime: Math.min(duration, currentTime + half),
      eventTag: "goal",
      markedAt: currentTime,
    };
    setClips((prev) => [...prev, clip].sort((a, b) => a.startTime - b.startTime));
    setSelectedClipId(clip.id);
    setRequestPause(Date.now());
    setShowGuide(false);
    setJustMarked(true);
    setTimeout(() => setJustMarked(false), 2500);
  }, [currentTime, duration, clips.length]);

  const handleRemoveClip = useCallback((id: string) => {
    setClips((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      // 삭제 후 남은 클립 중 첫 번째 자동 선택
      if (remaining.length > 0) {
        setTimeout(() => setSelectedClipId(remaining[0].id), 0);
      } else {
        setSelectedClipId(undefined);
      }
      return remaining;
    });
  }, []);

  const handleClipChange = useCallback((updated: ClipSegment) => {
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleUpdateClip = useCallback((id: string, updates: Partial<ClipSegment>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  // ════════════════════════════════════════════
  //  영상 미선택 — 가이드 포함 온보딩 화면
  // ════════════════════════════════════════════
  if (!videoSrc) {
    return (
      <div className="flex h-dvh flex-col bg-[#070709]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="rounded-full p-1.5 text-white/40 active:bg-white/8">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[15px] font-bold text-white">하이라이트 만들기</h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
          {/* 메인 CTA */}
          <div
            className="flex w-full max-w-sm cursor-pointer flex-col items-center gap-5 rounded-3xl p-8 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(180deg, rgba(212,168,83,0.08) 0%, rgba(212,168,83,0.02) 100%)",
              border: "1px solid rgba(212,168,83,0.15)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
              <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 0A1.125 1.125 0 014.5 4.5h15a1.125 1.125 0 011.125 1.125v12.75M3.375 5.625h17.25m0 0v12.75m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125v-1.5m-17.25 1.5v-1.5m0 0h17.25m-17.25 0h7.5c.621 0 1.125-.504 1.125-1.125V14.25m-8.625 1.5H6m.75 0v-1.5m0 0V9.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v1.5m0 0h.375" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[16px] font-bold text-white">경기 영상 불러오기</p>
              <p className="mt-1.5 text-[13px] text-white/40">MP4, MOV 파일</p>
            </div>
            <div className="rounded-xl bg-accent px-8 py-2.5 text-[14px] font-bold text-black">
              파일 선택
            </div>
          </div>

          {/* 사용 가이드 */}
          <div className="w-full max-w-sm space-y-3">
            <p className="text-center text-[11px] font-semibold tracking-wider text-white/25">사용 방법</p>
            <div className="flex gap-3">
              {[
                { step: "1", icon: "▶", title: "영상 재생", desc: "경기 영상을 재생하세요" },
                { step: "2", icon: "⚡", title: "장면 선택", desc: "좋은 장면에서 탭!" },
                { step: "3", icon: "✂", title: "구간 조절", desc: "드래그로 길이 조절" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-1 flex-col items-center gap-2 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-lg">
                    {item.icon}
                  </div>
                  <p className="text-[12px] font-bold text-white/80">{item.title}</p>
                  <p className="text-center text-[10px] leading-tight text-white/30">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  메인 에디터
  // ════════════════════════════════════════════
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#070709]">
      {/* ── 헤더 ── */}
      <div className="flex shrink-0 items-center justify-between px-3 py-2"
        style={{ background: "linear-gradient(180deg, rgba(7,7,9,0.95), rgba(7,7,9,0.8))" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setVideoSrc(null)} className="rounded-full p-1.5 text-white/40 active:bg-white/8">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[14px] font-bold text-white">하이라이트 만들기</span>
        </div>
        {clips.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.2)" }}>
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12px] font-bold text-accent">{clips.length}개 장면</span>
          </div>
        )}
      </div>

      {/* ── 영상 플레이어 ── */}
      <div className="relative flex-1 min-h-0 bg-black">
        <div className="absolute inset-0">
          <VideoPlayer
            src={videoSrc}
            playerData={playerData}
            onTimeUpdate={handleTimeUpdate}
            seekTo={seekTo}
            hudConfig={hudConfig}
            hudVisible={true}
            requestPause={requestPause}
            hideControls
          />
        </div>

        {/* 첫 사용 가이드 오버레이 */}
        {showGuide && clips.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-16">
            <div className="animate-bounce rounded-2xl bg-black/70 px-5 py-3 backdrop-blur-md"
              style={{ border: "1px solid rgba(212,168,83,0.2)" }}>
              <p className="text-[13px] text-white/90">
                <span className="font-bold text-accent">▶ 재생</span> 후 좋은 장면에서
                <span className="font-bold text-accent"> ⚡ 이 장면!</span>을 눌러주세요
              </p>
            </div>
          </div>
        )}

        {/* 마킹 성공 피드백 */}
        {justMarked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="animate-scale-up rounded-2xl bg-accent/90 px-6 py-3 shadow-2xl">
              <p className="text-[15px] font-black text-black">✓ 장면 추가됨!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 컨트롤 패널 ── */}
      <div className="shrink-0 bg-[#0C0C0E]" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        {/* 장면 추가 버튼 + 시간 */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="shrink-0 font-mono text-[12px] text-white/30 tabular-nums">
            {fmt(currentTime)}
          </span>

          {/* 프로그레스 바 (미니) */}
          <div className="relative flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/25 transition-all"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} />
            {/* 클립 구간 표시 */}
            {sortedClips.map((clip) => (
              <div key={clip.id} className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${(clip.startTime / duration) * 100}%`,
                  width: `${((clip.endTime - clip.startTime) / duration) * 100}%`,
                  background: EVENT_TAG_COLORS[clip.eventTag] + "88",
                }} />
            ))}
          </div>

          <span className="shrink-0 font-mono text-[12px] text-white/30 tabular-nums">
            {fmt(duration)}
          </span>

          {/* 핵심 CTA */}
          <button
            onClick={handleMark}
            disabled={clips.length >= 10 || duration === 0}
            className="shrink-0 flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-[13px] font-black text-white transition-all active:scale-95 disabled:opacity-25"
            style={{
              background: "linear-gradient(135deg, #D4A843, #E74C3C)",
              boxShadow: "0 4px 16px rgba(212,168,67,0.25), 0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
            이 장면!
          </button>
        </div>

        {/* 타임라인 */}
        <div className="px-3 pb-1">
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

        {/* 선택된 클립 편집 바 */}
        {selectedClip && (
          <div className="flex items-center gap-2 px-3 py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            {/* 태그 선택 — 이모지 + 컬러 도트 */}
            <div className="flex gap-1">
              {EVENTS.map((ev) => {
                const active = selectedClip.eventTag === ev.id;
                return (
                  <button
                    key={ev.id}
                    onClick={() => handleUpdateClip(selectedClip.id, { eventTag: ev.id as EventTag })}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
                    style={{
                      background: active ? EVENT_TAG_COLORS[ev.id] + "20" : "rgba(255,255,255,0.04)",
                      color: active ? EVENT_TAG_COLORS[ev.id] : "rgba(255,255,255,0.3)",
                      border: `1px solid ${active ? EVENT_TAG_COLORS[ev.id] + "40" : "transparent"}`,
                    }}
                  >
                    {ev.emoji}
                    {active && <span>{ev.label}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            {/* 구간 정보 */}
            <div className="flex items-center gap-1.5">
              <span className="rounded-lg bg-white/6 px-2 py-0.5 font-mono text-[11px] text-white/50">
                {fmt(selectedClip.startTime)}
              </span>
              <svg className="h-3 w-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M5 12h14m-4-4l4 4-4 4" />
              </svg>
              <span className="rounded-lg bg-white/6 px-2 py-0.5 font-mono text-[11px] text-white/50">
                {fmt(selectedClip.endTime)}
              </span>
              <span className="text-[10px] text-white/20">
                {Math.round(selectedClip.endTime - selectedClip.startTime)}초
              </span>
            </div>

            {/* 삭제 */}
            <button
              onClick={() => handleRemoveClip(selectedClip.id)}
              className="rounded-xl p-2 text-white/25 transition-colors active:bg-red-500/15 active:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* 클립 미리보기 리스트 (2개 이상일 때) */}
        {sortedClips.length >= 2 && (
          <div className="flex gap-2 overflow-x-auto px-3 py-2 no-scrollbar"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {sortedClips.map((clip, i) => {
              const active = clip.id === selectedClipId;
              const color = EVENT_TAG_COLORS[clip.eventTag];
              const ev = EVENTS.find((e) => e.id === clip.eventTag);
              return (
                <button
                  key={clip.id}
                  onClick={() => { setSelectedClipId(clip.id); setSeekTo(clip.startTime); setTimeout(() => setSeekTo(undefined), 100); }}
                  className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all active:scale-95"
                  style={{
                    background: active ? color + "15" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? color + "40" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <span className="text-[13px]">{ev?.emoji}</span>
                  <span className="font-mono text-[11px]" style={{ color: active ? color : "rgba(255,255,255,0.4)" }}>
                    {fmt(clip.startTime)}–{fmt(clip.endTime)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom,4px)]" />
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-scale-up {
          animation: scale-up 1.2s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
