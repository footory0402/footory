"use client";

import { useState } from "react";
import { MEASUREMENTS, getStatMeta } from "@/lib/constants";

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
  const [saving, setSaving] = useState(false);

  const measurement = selectedType ? getStatMeta(selectedType) : null;

  const reset = () => {
    setStep(resolveInitialStep(initialStatType));
    setSelectedType(MEASUREMENTS.find((m) => m.id === initialStatType) ? (initialStatType ?? "") : "");
    setValue("");
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
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    try {
      await onSave(selectedType, num);
      handleClose();
    } catch {
      setSaving(false);
    }
  };

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

              <div className="relative mb-6">
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
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !value || parseFloat(value) <= 0}
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
