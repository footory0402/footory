"use client";

import { useState } from "react";
import { useUploadStore, type Caption } from "@/stores/upload-store";

const MAX_CAPTIONS = 2;
const MAX_TEXT_LEN = 30;

type CaptionStyle = Caption["style"];
type CaptionPosition = Caption["position"];

const STYLES: { id: CaptionStyle; label: string; preview: string }[] = [
  { id: "sports", label: "스포츠", preview: "굵은 흰색 텍스트" },
  { id: "minimal", label: "미니멀", preview: "반투명 배경" },
  { id: "gold", label: "골드", preview: "금색 글로우" },
];

const POSITIONS: { id: CaptionPosition; label: string; icon: string }[] = [
  { id: "top", label: "상단", icon: "⬆" },
  { id: "center", label: "중앙", icon: "✛" },
  { id: "bottom", label: "하단", icon: "⬇" },
];

interface CaptionFormState {
  text: string;
  startTime: number;
  endTime: number;
  style: CaptionStyle;
  position: CaptionPosition;
}

export default function CaptionTab() {
  const trimStart = useUploadStore((s) => s.trimStart);
  const trimEnd = useUploadStore((s) => s.trimEnd);
  const duration = useUploadStore((s) => s.duration) ?? 0;
  const captions = useUploadStore((s) => s.captions);
  const addCaption = useUploadStore((s) => s.addCaption);
  const removeCaption = useUploadStore((s) => s.removeCaption);
  const setCaptions = useUploadStore((s) => s.setCaptions);

  const effectiveTrimEnd = trimEnd ?? duration;
  const clipDuration = effectiveTrimEnd - trimStart;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CaptionFormState>({
    text: "",
    startTime: 0,
    endTime: Math.min(3, clipDuration),
    style: "sports",
    position: "bottom",
  });

  const formatTime = (t: number) => {
    const sec = Math.max(0, t).toFixed(1);
    return `${sec}s`;
  };

  const handleAdd = () => {
    if (!form.text.trim()) return;
    addCaption({
      text: form.text.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      style: form.style,
      position: form.position,
    });
    setForm({ text: "", startTime: 0, endTime: Math.min(3, clipDuration), style: "sports", position: "bottom" });
    setShowForm(false);
  };

  const stylePreview = (c: Caption) => {
    switch (c.style) {
      case "sports":
        return { color: "#fff", fontFamily: "var(--font-stat)", fontWeight: 800, textShadow: "2px 2px 8px rgba(0,0,0,0.9)" };
      case "minimal":
        return { color: "#fff", fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "6px" };
      case "gold":
        return { background: "linear-gradient(135deg, #D4A853, #F5E6B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-brand)", fontWeight: 700 };
    }
  };

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* 가이드 */}
      <div className="rounded-xl p-3" style={{ background: "rgba(212,168,83,0.07)", border: "1px solid rgba(212,168,83,0.15)" }}>
        <p className="text-[12px] text-accent/80 leading-relaxed">
          💬 재생 중 특정 시간에 나타나는 텍스트를 추가하세요. 최대 2개까지 가능합니다.
        </p>
      </div>

      {/* 기존 캡션 목록 */}
      {captions.length > 0 && (
        <div className="space-y-2">
          {captions.map((cap, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* 미리보기 */}
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] truncate" style={stylePreview(cap)}>
                  {cap.text}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-text-3">
                    {formatTime(cap.startTime)} ~ {formatTime(cap.endTime)}
                  </span>
                  <span className="text-[10px] text-text-3">·</span>
                  <span className="text-[10px] text-text-3">{STYLES.find(s => s.id === cap.style)?.label}</span>
                  <span className="text-[10px] text-text-3">·</span>
                  <span className="text-[10px] text-text-3">{POSITIONS.find(p => p.id === cap.position)?.label}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCaption(i)}
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center active:bg-white/10"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 캡션 추가 버튼 또는 폼 */}
      {captions.length < MAX_CAPTIONS && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          style={{ border: "1.5px dashed rgba(212,168,83,0.3)", background: "rgba(212,168,83,0.04)", color: "#D4A853" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[13px] font-semibold">캡션 추가</span>
        </button>
      )}

      {/* 캡션 입력 폼 */}
      {showForm && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
          <div className="px-3 py-3 space-y-3">
            {/* 텍스트 입력 */}
            <div>
              <label className="block text-[11px] font-semibold text-text-2 mb-1.5">텍스트</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => setForm(f => ({ ...f, text: e.target.value.slice(0, MAX_TEXT_LEN) }))}
                  placeholder="예: 첫 골! 🎉"
                  className="w-full rounded-lg px-3 py-2.5 text-[14px] text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-3">
                  {form.text.length}/{MAX_TEXT_LEN}
                </span>
              </div>
            </div>

            {/* 표시 시간 */}
            <div>
              <label className="block text-[11px] font-semibold text-text-2 mb-1.5">표시 시간</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-text-3 mb-1">시작</p>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, clipDuration - 0.5)}
                    step={0.1}
                    value={form.startTime}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setForm(f => ({ ...f, startTime: v, endTime: Math.max(f.endTime, v + 0.5) }));
                    }}
                    className="w-full accent-accent"
                  />
                  <p className="text-[10px] font-mono text-accent text-center">{formatTime(form.startTime)}</p>
                </div>
                <div className="text-text-3 text-[12px]">~</div>
                <div className="flex-1">
                  <p className="text-[10px] text-text-3 mb-1">끝</p>
                  <input
                    type="range"
                    min={Math.min(form.startTime + 0.5, clipDuration)}
                    max={clipDuration}
                    step={0.1}
                    value={form.endTime}
                    onChange={(e) => setForm(f => ({ ...f, endTime: parseFloat(e.target.value) }))}
                    className="w-full accent-accent"
                  />
                  <p className="text-[10px] font-mono text-accent text-center">{formatTime(form.endTime)}</p>
                </div>
              </div>
            </div>

            {/* 스타일 선택 */}
            <div>
              <label className="block text-[11px] font-semibold text-text-2 mb-1.5">스타일</label>
              <div className="flex gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, style: s.id }))}
                    className="flex-1 rounded-lg py-2 text-center transition-all active:scale-95"
                    style={{
                      background: form.style === s.id ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${form.style === s.id ? "#D4A853" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <span className="block text-[12px] font-semibold" style={{ color: form.style === s.id ? "#D4A853" : "rgba(255,255,255,0.5)" }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 위치 선택 */}
            <div>
              <label className="block text-[11px] font-semibold text-text-2 mb-1.5">위치</label>
              <div className="flex gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, position: p.id }))}
                    className="flex-1 rounded-lg py-2 flex flex-col items-center gap-0.5 transition-all active:scale-95"
                    style={{
                      background: form.position === p.id ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${form.position === p.id ? "#D4A853" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <span className="text-[14px]">{p.icon}</span>
                    <span className="text-[10px] font-semibold" style={{ color: form.position === p.id ? "#D4A853" : "rgba(255,255,255,0.4)" }}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 미리보기 */}
            {form.text && (
              <div className="rounded-lg py-2 px-3 text-center" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-text-3 mb-1.5">미리보기</p>
                <span
                  className="text-[15px] inline-block"
                  style={(() => {
                    switch (form.style) {
                      case "sports": return { color: "#fff", fontFamily: "var(--font-stat)", fontWeight: 800, textShadow: "2px 2px 8px rgba(0,0,0,0.9)" };
                      case "minimal": return { color: "#fff", fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "6px" };
                      case "gold": return { background: "linear-gradient(135deg, #D4A853, #F5E6B8)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent", fontFamily: "var(--font-brand)", fontWeight: 700 };
                    }
                  })()}
                >
                  {form.text}
                </span>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-text-3 active:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!form.text.trim()}
                className="flex-1 rounded-lg py-2.5 text-[13px] font-bold text-bg active:scale-[0.99] disabled:opacity-40"
                style={{ background: "#D4A853" }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 빈 상태 힌트 */}
      {captions.length === 0 && !showForm && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[11px] text-text-3 leading-relaxed">
              &quot;첫 골&quot;, &quot;U-12 리그 결승&quot; 같은 짧은 텍스트를 추가해 스카우트에게 맥락을 전달하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
