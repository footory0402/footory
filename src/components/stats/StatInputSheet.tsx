"use client";

import { useState, useMemo } from "react";
import { MEASUREMENTS, getStatMeta, getStatWarning } from "@/lib/constants";
import { useProfile } from "@/hooks/useProfile";

interface StatInputSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (statType: string, value: number, evidenceClipId?: string) => Promise<void>;
  initialStatType?: string;
}

type Step = "type" | "value";

function resolveInitialStep(initialStatType?: string): Step {
  if (!initialStatType) return "type";
  const known = MEASUREMENTS.find((m) => m.id === initialStatType);
  return known ? "value" : "type";
}

export default function StatInputSheet({ open, onClose, onSave, initialStatType }: StatInputSheetProps) {
  const [step, setStep] = useState<Step>(() => resolveInitialStep(initialStatType));
  const [selectedType, setSelectedType] = useState<string>(
    MEASUREMENTS.find((m) => m.id === initialStatType) ? (initialStatType ?? "") : ""
  );
  const [value, setValue] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [saving, setSaving] = useState(false);
  const { profile } = useProfile();

  const measurement = selectedType ? getStatMeta(selectedType) : null;
  const isTimeInput = measurement?.unit === "분:초";

  // 실시간 범위 경고 계산
  const warning = useMemo(() => {
    if (!selectedType) return null;
    let num: number;
    if (isTimeInput) {
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      num = m * 60 + s;
    } else {
      num = parseFloat(value);
    }
    if (isNaN(num) || num <= 0) return null;
    return getStatWarning(selectedType, num, profile?.birthYear);
  }, [selectedType, value, minutes, seconds, isTimeInput, profile?.birthYear]);

  const reset = () => {
    setStep(resolveInitialStep(initialStatType));
    setSelectedType(MEASUREMENTS.find((m) => m.id === initialStatType) ? (initialStatType ?? "") : "");
    setValue("");
    setMinutes("");
    setSeconds("");
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectType = (id: string) => {
    setSelectedType(id);
    setStep("value");
  };

  const handleSave = async () => {
    let num: number;
    if (isTimeInput) {
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      num = m * 60 + s;
      if (num <= 0) return;
    } else {
      num = parseFloat(value);
      if (isNaN(num) || num <= 0) return;
    }

    // 범위 초과 시 차단
    if (warning?.type === "blocked") return;

    setSaving(true);
    try {
      await onSave(selectedType, num);
      handleClose();
    } catch {
      setSaving(false);
    }
  };

  const isTimeValid = isTimeInput
    ? (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0) > 0
    : false;

  const isBlocked = warning?.type === "blocked";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {step === "type" && (
            <>
              <h2 className="mb-4 text-lg font-bold text-text-1">측정 종류 선택</h2>
              <div className="flex flex-col gap-2">
                {MEASUREMENTS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectType(m.id)}
                    className="flex items-center gap-3 rounded-xl bg-bg px-4 py-3 text-left ring-1 ring-border transition-colors active:ring-accent"
                  >
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-text-1">{m.label}</p>
                      <p className="text-xs text-text-3">단위: {m.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "value" && measurement && (
            <>
              {!initialStatType && (
                <button
                  onClick={() => setStep("type")}
                  className="mb-3 text-xs text-text-3"
                >
                  ← 종류 다시 선택
                </button>
              )}
              <h2 className="mb-1 text-lg font-bold text-text-1">
                {measurement.label}
              </h2>
              <p className="mb-5 text-xs text-text-3">기록 값을 입력하세요</p>

              <div className="relative mb-3">
                {isTimeInput ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        placeholder="0"
                        autoFocus
                        min={0}
                        max={59}
                        className="w-full rounded-xl bg-bg px-4 py-4 pr-10 text-center font-stat text-3xl font-bold text-text-1 outline-none ring-1 ring-border focus:ring-accent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-3">분</span>
                    </div>
                    <span className="font-stat text-2xl font-bold text-text-3">:</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={seconds}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (e.target.value === "" || (v >= 0 && v <= 59)) setSeconds(e.target.value);
                        }}
                        placeholder="00"
                        min={0}
                        max={59}
                        className="w-full rounded-xl bg-bg px-4 py-4 pr-10 text-center font-stat text-3xl font-bold text-text-1 outline-none ring-1 ring-border focus:ring-accent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-3">초</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0"
                      autoFocus
                      className="w-full rounded-xl bg-bg px-4 py-4 pr-16 text-center font-stat text-3xl font-bold text-text-1 outline-none ring-1 ring-border focus:ring-accent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-3">
                      {measurement.unit}
                    </span>
                  </>
                )}
              </div>

              {/* 어뷰징 경고 메시지 */}
              {warning && (
                <div
                  className={`mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                    warning.type === "blocked"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {warning.type === "blocked" ? "🚫" : "⚠️"}
                  </span>
                  <span>{warning.message}</span>
                </div>
              )}

              {!warning && <div className="mb-3" />}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || isBlocked || (isTimeInput ? !isTimeValid : !value || parseFloat(value) <= 0)}
                  className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-bg disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
