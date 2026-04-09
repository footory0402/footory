"use client";

export type TransitionType = "cut" | "fade";

export interface ReelClipItem {
  id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  memo: string | null;
  transition: TransitionType;
}

interface ClipOrderEditorProps {
  items: ReelClipItem[];
  onChange: (items: ReelClipItem[]) => void;
  title: string;
  onTitleChange: (t: string) => void;
}

function formatDuration(sec: number | null) {
  if (!sec) return "0s";
  return sec < 60 ? `${Math.round(sec)}s` : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

export default function ClipOrderEditor({ items, onChange, title, onTitleChange }: ClipOrderEditorProps) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 제목 입력 */}
      <div className="px-4 py-3 shrink-0">
        <label htmlFor="reel-title" className="mb-2 block text-[11px] font-semibold text-text-3">
          릴 제목
        </label>
        <input
          id="reel-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, 40))}
          placeholder="릴 제목 (선택)"
          className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/20 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* 안내 */}
      <div className="px-4 pb-2 shrink-0">
        <p className="text-[11px] text-text-3">
          위아래 버튼으로 순서를 바꾸고, 필요 없는 클립은 제외할 수 있어요.
        </p>
      </div>

      {/* 클립 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {items.map((item, i) => (
          <div key={item.id}>
            {/* 클립 카드 */}
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* 순서 번호 */}
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-bg" style={{ background: "#D4A853" }}>
                {i + 1}
              </span>

              {/* 썸네일 */}
              <div className="shrink-0 w-10 h-14 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[16px]">🎬</span>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-1 truncate">
                  {item.memo || `클립 ${i + 1}`}
                </p>
                <p className="text-[10px] text-text-3">{formatDuration(item.duration_seconds)}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`${i + 1}번 클립 위로 이동`}
                  className="flex h-7 w-7 items-center justify-center rounded-full active:bg-white/10 disabled:opacity-30"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === items.length - 1}
                  aria-label={`${i + 1}번 클립 아래로 이동`}
                  className="flex h-7 w-7 items-center justify-center rounded-full active:bg-white/10 disabled:opacity-30"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* 삭제 */}
              {items.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center active:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
