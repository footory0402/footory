"use client";

import { useRef, useState } from "react";

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
  const dragIdx = useRef<number | null>(null);
  const [draggingOver, setDraggingOver] = useState<number | null>(null);

  const handleDragStart = (i: number) => { dragIdx.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDraggingOver(i); };
  const handleDrop = (i: number) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDraggingOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    onChange(next);
    dragIdx.current = null;
    setDraggingOver(null);
  };

  const setTransition = (i: number, t: TransitionType) => {
    const next = [...items];
    next[i] = { ...next[i], transition: t };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 제목 입력 */}
      <div className="px-4 py-3 shrink-0">
        <input
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
          💡 드래그하여 순서를 변경하세요
        </p>
      </div>

      {/* 클립 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {items.map((item, i) => (
          <div key={item.id}>
            {/* 클립 카드 */}
            <div
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => setDraggingOver(null)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all"
              style={{
                background: draggingOver === i ? "rgba(212,168,83,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${draggingOver === i ? "rgba(212,168,83,0.3)" : "rgba(255,255,255,0.07)"}`,
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

              {/* 드래그 핸들 */}
              <div className="shrink-0 flex flex-col gap-1 px-1 py-2">
                {[0,1,2].map((n) => (
                  <div key={n} className="w-4 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                ))}
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

            {/* 트랜지션 선택 (마지막 클립 제외) */}
            {i < items.length - 1 && (
              <div className="flex items-center justify-center gap-2 py-1.5">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                {(["cut", "fade"] as TransitionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTransition(i, t)}
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all active:scale-95"
                    style={{
                      background: item.transition === t ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${item.transition === t ? "#D4A853" : "rgba(255,255,255,0.08)"}`,
                      color: item.transition === t ? "#D4A853" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {t === "cut" ? "컷" : "페이드"}
                  </button>
                ))}
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
