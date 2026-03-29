"use client";

import { useCallback } from "react";
import type { ClipSegment } from "./types";
import { EVENTS, EVENT_TAG_COLORS } from "./types";

interface ConfirmViewProps {
  clips: ClipSegment[];
  videoFile: File;
  playerName: string;
  playerNumber?: string;
  hasPlayerCard?: boolean;
  includeIntro?: boolean;
  onToggleIntro?: (v: boolean) => void;
  onBack: () => void;
  onGenerate: () => void;
  onUpdateClip: (id: string, updates: Partial<ClipSegment>) => void;
  onRemoveClip: (id: string) => void;
  onReorderClips: (clips: ClipSegment[]) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ConfirmView({
  clips, videoFile, playerName, playerNumber,
  hasPlayerCard, includeIntro, onToggleIntro,
  onBack, onGenerate, onUpdateClip, onRemoveClip, onReorderClips,
}: ConfirmViewProps) {
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);

  const moveClip = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= clips.length) return;
    const reordered = [...clips];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    onReorderClips(reordered);
  }, [clips, onReorderClips]);

  return (
    <div className="flex h-dvh flex-col bg-[#070709]">
      {/* 헤더 */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-white/50 active:text-white/80">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[13px] font-semibold">주인공 표시로</span>
        </button>
        <span className="text-[12px] text-white/30">Step 3/3</span>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex justify-center gap-1.5 pb-4">
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-accent" />
      </div>

      {/* 타이틀 */}
      <div className="px-4 pb-4 text-center">
        <h2 className="text-[16px] font-extrabold text-white">하이라이트 확인</h2>
        <p className="mt-1 text-[12px] text-white/40">아래 구간들이 순서대로 합쳐집니다</p>
      </div>

      {/* 클립 리스트 */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-3">
          {clips.map((clip, i) => {
            const ev = EVENTS.find((e) => e.id === clip.eventTag);
            const color = EVENT_TAG_COLORS[clip.eventTag];
            const duration = Math.round(clip.endTime - clip.startTime);

            return (
              <div
                key={clip.id}
                className="overflow-hidden rounded-xl"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}20`,
                }}
              >
                {/* 정보 바 */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {/* 순서 변경 */}
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => moveClip(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-[10px] text-white/25 active:text-white/60 disabled:opacity-20"
                    >▲</button>
                    <button
                      onClick={() => moveClip(i, 1)}
                      disabled={i === clips.length - 1}
                      className="rounded p-1 text-[10px] text-white/25 active:text-white/60 disabled:opacity-20"
                    >▼</button>
                  </div>

                  {/* 이벤트 태그 + 마커 아이콘 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px]">{ev?.emoji}</span>
                    <span className="text-[13px] font-semibold text-white">{ev?.label}</span>
                    {clip.markerX != null && clip.freezeAt != null && (
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-accent"
                        style={{ background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.2)" }}>
                        📍 주인공
                      </span>
                    )}
                  </div>

                  {/* 시간 정보 */}
                  <div className="flex-1 text-right font-mono text-[11px] text-white/40">
                    {fmt(clip.startTime)} → {fmt(clip.endTime)} · {duration}초
                  </div>

                  {/* 삭제 */}
                  <button
                    onClick={() => onRemoveClip(clip.id)}
                    className="shrink-0 rounded-lg p-1.5 text-white/20 active:bg-red-500/15 active:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 요약 */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-accent">{clips.length}개</div>
            <div className="text-[10px] text-white/40">구간</div>
          </div>
          <div className="w-px bg-white/8" />
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-accent">{Math.round(totalDuration)}초</div>
            <div className="text-[10px] text-white/40">총 길이</div>
          </div>
        </div>

        {/* 힌트 */}
        <p className="mt-3 pb-2 text-center text-[11px] text-white/25">
          주인공 표시를 수정하려면 뒤로가기를 눌러주세요
        </p>
      </div>

      {/* 인트로 카드 토글 + CTA */}
      <div className="shrink-0 px-4 pb-[env(safe-area-inset-bottom,16px)] pt-3">
        {/* 인트로 카드 토글 */}
        {hasPlayerCard && onToggleIntro && (
          <button
            onClick={() => onToggleIntro(!includeIntro)}
            className="mb-3 flex w-full items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: includeIntro ? "rgba(212,168,83,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${includeIntro ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[14px]">🎴</span>
              <div className="text-left">
                <div className="text-[13px] font-semibold text-white">인트로 카드</div>
                <div className="text-[11px] text-white/40">영상 앞에 선수 카드 2초 추가</div>
              </div>
            </div>
            <div className={`h-6 w-10 rounded-full p-0.5 transition-colors ${includeIntro ? "bg-accent" : "bg-white/15"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${includeIntro ? "translate-x-4" : ""}`} />
            </div>
          </button>
        )}

        <button
          onClick={onGenerate}
          disabled={clips.length === 0}
          className="w-full rounded-2xl py-4 text-[15px] font-extrabold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{
            background: "linear-gradient(135deg, #D4A853, #C0392B)",
            boxShadow: "0 4px 20px rgba(212,168,67,0.3)",
          }}
        >
          🎬 하이라이트 생성하기
        </button>
      </div>
    </div>
  );
}
