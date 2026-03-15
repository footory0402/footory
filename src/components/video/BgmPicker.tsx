"use client";

import { useEffect, useState } from "react";
import { BGM_CATEGORIES, type BgmTrack, type BgmCategory } from "@/lib/bgm-tracks";
import { useAudioPreview } from "@/hooks/useAudioPreview";

interface BgmPickerProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function BgmPicker({ selectedId, onSelect }: BgmPickerProps) {
  const [tracks, setTracks] = useState<BgmTrack[]>([]);
  const [category, setCategory] = useState<BgmCategory>("epic");
  const [loading, setLoading] = useState(true);
  const { playingId, play, stop } = useAudioPreview();

  // Supabase에서 BGM 목록 로드
  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await fetch("/api/bgm");
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadTracks();
  }, []);

  // 언마운트 시 오디오 정지
  useEffect(() => {
    return () => stop();
  }, [stop]);

  const filteredTracks = tracks.filter((t) => t.category === category);

  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

  return (
    <div className="flex flex-col gap-4">
      {/* 카테고리 칩 */}
      <div className="flex gap-2">
        {BGM_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`rounded-[20px] border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              category === cat.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-[#2a2a2e] bg-[#161618] text-text-2"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* 트랙 목록 */}
      {loading ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : filteredTracks.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-text-3">
          이 카테고리에 사용 가능한 BGM이 없습니다
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {filteredTracks.map((track) => {
            const isSelected = selectedId === track.id;
            const isPlaying = playingId === track.id;

            return (
              <div
                key={track.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  isSelected ? "bg-accent/10 border border-accent/30" : "bg-card"
                }`}
              >
                {/* 미리듣기 버튼 */}
                <button
                  type="button"
                  onClick={() =>
                    play(track.id, `${r2PublicUrl}/${track.r2Key}`)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"
                >
                  {isPlaying ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-accent"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-text-2"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[14px] font-medium text-text-1">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-text-3">
                    {track.artist ?? "Unknown"} · {track.durationSec}초
                  </p>
                </div>

                {/* 선택 */}
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? null : track.id)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    isSelected
                      ? "bg-accent text-bg"
                      : "bg-white/[0.06] text-text-2"
                  }`}
                >
                  {isSelected ? "선택됨" : "선택"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 선택 해제 */}
      {selectedId && (
        <button
          type="button"
          onClick={() => {
            stop();
            onSelect(null);
          }}
          className="text-center text-[12px] text-text-3 underline underline-offset-2"
        >
          BGM 선택 해제
        </button>
      )}
    </div>
  );
}
