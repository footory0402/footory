"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";

interface BgmTrack {
  id: string;
  title: string;
  artist: string | null;
  category: "epic" | "chill" | "hype" | "cinematic";
  url: string;
  duration_sec: number;
  bpm: number | null;
}

const CATEGORIES: { id: string; label: string; emoji: string }[] = [
  { id: "", label: "전체", emoji: "🎵" },
  { id: "epic", label: "에픽", emoji: "⚡" },
  { id: "hype", label: "하이프", emoji: "🔥" },
  { id: "cinematic", label: "시네마틱", emoji: "🎬" },
  { id: "chill", label: "칠", emoji: "✨" },
];

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BgmSelector() {
  const bgmId = useUploadStore((s) => s.bgmId);
  const bgmVolume = useUploadStore((s) => s.bgmVolume);
  const originalVolume = useUploadStore((s) => s.originalVolume);
  const setBgm = useUploadStore((s) => s.setBgm);
  const setBgmVolume = useUploadStore((s) => s.setBgmVolume);
  const setOriginalVolume = useUploadStore((s) => s.setOriginalVolume);

  const [tracks, setTracks] = useState<BgmTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/bgm?category=${category}` : "/api/bgm";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTracks(data.tracks ?? []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [category]);

  const togglePreview = useCallback((track: BgmTrack) => {
    if (previewId === track.id) {
      audioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    // 기존 오디오 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(track.url);
    audio.volume = 0.4;
    audio.play().catch(() => {});
    // 15초 후 자동 정지
    setTimeout(() => {
      audio.pause();
      setPreviewId((cur) => (cur === track.id ? null : cur));
    }, 15000);
    audio.onended = () => setPreviewId((cur) => (cur === track.id ? null : cur));
    audioRef.current = audio;
    setPreviewId(track.id);
  }, [previewId]);

  // 컴포넌트 언마운트 시 오디오 정지
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const selectedTrack = tracks.find((t) => t.id === bgmId);

  return (
    <div className="space-y-4 pt-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px]">🎵</span>
          <span className="text-[13px] font-bold text-white">배경 음악</span>
          {selectedTrack && (
            <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}>
              {selectedTrack.title}
            </span>
          )}
        </div>
        {bgmId && (
          <button
            type="button"
            onClick={() => setBgm(null)}
            className="text-[11px] text-text-3 underline underline-offset-2 active:text-white"
          >
            해제
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95"
            style={{
              background: category === c.id ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${category === c.id ? "#D4A853" : "rgba(255,255,255,0.08)"}`,
              color: category === c.id ? "#D4A853" : "rgba(255,255,255,0.45)",
            }}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* 트랙 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[12px] text-text-3">준비 중인 트랙입니다</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none">
          {tracks.map((track) => {
            const isSelected = bgmId === track.id;
            const isPreviewing = previewId === track.id;
            return (
              <div
                key={track.id}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  background: isSelected ? "rgba(212,168,83,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "rgba(212,168,83,0.35)" : "rgba(255,255,255,0.06)"}`,
                }}
                onClick={() => setBgm(isSelected ? null : track.id)}
              >
                {/* 재생 버튼 */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: isPreviewing ? "#D4A853" : "rgba(255,255,255,0.08)" }}
                >
                  {isPreviewing ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="#000">
                      <rect x="1" y="1" width="3" height="8" rx="1" />
                      <rect x="6" y="1" width="3" height="8" rx="1" />
                    </svg>
                  ) : (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill={isSelected ? "#D4A853" : "rgba(255,255,255,0.5)"}>
                      <path d="M0 0l10 6-10 6z" />
                    </svg>
                  )}
                </button>

                {/* 트랙 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: isSelected ? "#D4A853" : "#FAFAFA" }}>
                    {track.title}
                  </p>
                  {track.artist && (
                    <p className="text-[10px] text-text-3 truncate">{track.artist}</p>
                  )}
                </div>

                {/* 길이 + 선택 표시 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-text-3">{formatDuration(track.duration_sec)}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#D4A853" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#000" strokeWidth={1.5}>
                        <path d="M1.5 4l2 2 3-3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 볼륨 믹서 (BGM 선택 시) */}
      {bgmId && (
        <div className="rounded-xl px-3 py-3 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] font-semibold text-text-2">볼륨 믹스</p>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-3 w-16 shrink-0">원본 소리</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={originalVolume}
                onChange={(e) => setOriginalVolume(parseInt(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="text-[10px] font-mono text-accent w-8 text-right shrink-0">{originalVolume}%</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-3 w-16 shrink-0">배경 음악</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseInt(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="text-[10px] font-mono text-accent w-8 text-right shrink-0">{bgmVolume}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
