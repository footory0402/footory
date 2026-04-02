"use client";

import { useState } from "react";
import { getStatMeta } from "@/lib/constants";
import { formatStatValue, normalizeStatUnit } from "@/lib/stat-display";
import { useBackClose } from "@/hooks/useBackClose";
import type { StatsApiStat } from "@/hooks/useStats";

interface StatHistorySheetProps {
  open: boolean;
  onClose: () => void;
  statType: string;
  records: StatsApiStat[];
  onAddNew: () => void;
  onEdit: (record: StatsApiStat) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function StatHistorySheet({
  open,
  onClose,
  statType,
  records,
  onAddNew,
  onEdit,
  onDelete,
}: StatHistorySheetProps) {
  useBackClose(open, onClose);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!open) return null;

  const meta = getStatMeta(statType);
  const unit = normalizeStatUnit(statType);
  const lowerIsBetter = meta?.lowerIsBetter ?? false;

  // 최신순 정렬
  const sorted = [...records].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  // 최고 기록
  const allValues = sorted.map((r) => r.value);
  const bestValue = allValues.length > 0
    ? (lowerIsBetter ? Math.min(...allValues) : Math.max(...allValues))
    : null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        {/* 핸들 바 */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* 헤더 */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-1">
                {meta?.label ?? statType}
              </h2>
              <p className="text-xs text-text-3">기록 내역</p>
            </div>
            <button onClick={onClose} className="text-text-3 text-sm px-2 py-1">
              닫기
            </button>
          </div>

          {/* 요약 */}
          {sorted.length > 0 && bestValue != null && (
            <div className="mb-4 flex items-center gap-4 rounded-xl bg-bg px-4 py-3 ring-1 ring-border">
              <div>
                <p className="text-[10px] font-medium text-text-3 uppercase tracking-wide">최고기록</p>
                <p className="font-stat text-xl font-bold text-accent">
                  {formatStatValue(bestValue, statType)} <span className="text-xs text-text-3">{unit}</span>
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-[10px] font-medium text-text-3 uppercase tracking-wide">총 측정</p>
                <p className="font-stat text-xl font-bold text-text-1">{sorted.length}<span className="text-xs text-text-3 ml-0.5">회</span></p>
              </div>
            </div>
          )}

          {/* 기록 리스트 */}
          <div className="mb-4 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-3">기록이 없습니다</div>
            ) : (
              sorted.map((record, idx) => {
                const prevRecord = sorted[idx + 1];
                const delta = prevRecord ? record.value - prevRecord.value : null;
                const improved = delta != null && (lowerIsBetter ? delta < 0 : delta > 0);
                const declined = delta != null && (lowerIsBetter ? delta > 0 : delta < 0);
                const isPR = record.value === bestValue && sorted.length > 1;
                const isDeleting = deletingId === record.id;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl bg-bg px-4 py-3 ring-1 ring-border"
                    style={isPR ? { borderColor: "rgba(212,168,83,0.3)", backgroundColor: "rgba(212,168,83,0.04)" } : undefined}
                  >
                    {/* 왼쪽: 값 + 변화량 + 날짜 */}
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-stat text-xl font-bold text-text-1" style={isPR ? { color: "var(--color-accent)" } : undefined}>
                            {formatStatValue(record.value, statType)}
                          </span>
                          <span className="text-xs text-text-3">{unit}</span>
                          {isPR && (
                            <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent tracking-wide">PR</span>
                          )}
                          {idx === sorted.length - 1 && sorted.length > 1 && (
                            <span className="rounded-full bg-bg px-1.5 py-0.5 text-[9px] text-text-3 ring-1 ring-border">첫 기록</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-text-3">{formatDate(record.recorded_at)}</span>
                          {delta != null && (
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: improved ? "rgb(74,222,128)" : declined ? "rgb(248,113,113)" : "var(--color-text-3)" }}
                            >
                              {improved ? "▲" : declined ? "▼" : "–"}
                              {Math.abs(delta).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 수정/삭제 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(record)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-2 ring-1 ring-border active:bg-bg"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={isDeleting}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-400/30 active:bg-red-400/10 disabled:opacity-40"
                      >
                        {isDeleting ? "..." : "삭제"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 새 기록 추가 버튼 */}
          <button
            onClick={onAddNew}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-bg"
            style={{ background: "var(--accent-gradient, var(--color-accent))" }}
          >
            + 새 기록 추가
          </button>
        </div>
      </div>
    </div>
  );
}
