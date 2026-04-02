"use client";

interface ClipItem {
  id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  memo: string | null;
  effects?: { captions?: unknown[] } | null;
}

interface ClipSelectorProps {
  clips: ClipItem[];
  selected: string[];
  onToggle: (id: string) => void;
  maxDuration: number;
  totalDuration: number;
}

function formatDuration(sec: number | null) {
  if (!sec) return "0s";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

export default function ClipSelector({ clips, selected, onToggle, maxDuration, totalDuration }: ClipSelectorProps) {
  const pct = Math.min(100, (totalDuration / maxDuration) * 100);
  const overLimit = totalDuration > maxDuration;

  return (
    <div className="flex flex-col h-full">
      {/* 진행 표시 */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-semibold text-text-2">
            선택 {selected.length}개
          </span>
          <span className={`text-[12px] font-mono ${overLimit ? "text-red-400" : "text-accent"}`}>
            {formatDuration(totalDuration)} / {maxDuration}s
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: overLimit ? "#ef4444" : "#D4A853" }}
          />
        </div>
        {overLimit && (
          <p className="text-[11px] text-red-400 mt-1">총 {maxDuration}초를 초과했습니다</p>
        )}
      </div>

      {/* 클립 그리드 */}
      {clips.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="text-[40px]">🎬</span>
          <p className="text-[14px] font-semibold text-text-1">업로드한 클립이 없습니다</p>
          <p className="text-[12px] text-text-3">영상을 먼저 업로드하고 릴을 만들어보세요</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-2 pt-1">
            {clips.map((clip, idx) => {
              const isSelected = selected.includes(clip.id);
              const order = selected.indexOf(clip.id) + 1;
              return (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => onToggle(clip.id)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden transition-all active:scale-95"
                  style={{
                    outline: isSelected ? "2px solid #D4A853" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {/* 썸네일 */}
                  {clip.thumbnail_url ? (
                    <img
                      src={clip.thumbnail_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `hsl(${(idx * 37) % 360}, 20%, 20%)` }}
                    >
                      <span className="text-[24px]">🎬</span>
                    </div>
                  )}

                  {/* 어두운 그라데이션 */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />

                  {/* 길이 */}
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-white/80">
                    {formatDuration(clip.duration_seconds)}
                  </span>

                  {/* 선택 뱃지 */}
                  {isSelected ? (
                    <div
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-bg"
                      style={{ background: "#D4A853" }}
                    >
                      {order}
                    </div>
                  ) : (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full"
                      style={{ border: "1.5px solid rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.3)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
