"use client";

import { useState, useEffect } from "react";
import { useStats } from "@/hooks/useStats";
import { getStatMeta, PLAY_STYLES, type PlayStyleType } from "@/lib/constants";
import Link from "next/link";
import { formatStatDelta, formatStatValue, isTimeStatUnit, normalizeStatUnit } from "@/lib/stat-display";

export default function MyRecordsTab() {
  const { stats, loading } = useStats();
  const [percentiles, setPercentiles] = useState<Record<string, number>>({});
  const [percLoading, setPercLoading] = useState(true);
  const [playStyleType, setPlayStyleType] = useState<PlayStyleType | null>(null);

  useEffect(() => {
    fetch("/api/stats/percentile")
      .then((r) => (r.ok ? r.json() : { percentiles: {} }))
      .then((d) => setPercentiles(d.percentiles ?? {}))
      .catch(() => {})
      .finally(() => setPercLoading(false));

    fetch("/api/play-style")
      .then((r) => (r.ok ? r.json() : { playStyle: null }))
      .then((d) => {
        if (d.playStyle?.styleType) setPlayStyleType(d.playStyle.styleType);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card-elevated p-4">
              <div className="h-3 w-16 rounded bg-card-alt mb-3" />
              <div className="h-7 w-20 rounded bg-card-alt mb-2" />
              <div className="h-2.5 w-12 rounded bg-card-alt" />
            </div>
          ))}
        </div>
        <div className="card-elevated p-4">
          <div className="h-4 w-24 rounded bg-card-alt mb-4" />
          {[0, 1].map((i) => (
            <div key={i} className="mb-3">
              <div className="h-3 w-full rounded bg-card-alt mb-2" />
              <div className="h-2 w-full rounded-full bg-card-alt" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center pt-12 text-center animate-fade-up">
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-accent/5" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-[0_0_20px_rgba(212,168,83,0.1)]">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        <p className="text-[15px] font-bold text-text-1">아직 등록된 기록이 없어요</p>
        <p className="mt-1.5 text-[13px] text-text-3 leading-relaxed">
          신체 측정 기록을 등록하면<br />내 위치와 성장 추이를 확인할 수 있어요
        </p>
        <Link
          href="/profile?tab=기록"
          className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-bold text-bg transition-transform active:scale-95"
          style={{ background: "var(--accent-gradient)" }}
        >
          <span>📝</span>
          첫 기록 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 플레이 스타일 요약 */}
      {playStyleType && PLAY_STYLES[playStyleType] && (
        <Link href="/profile?tab=기록" className="block">
          <div className="card-elevated flex items-center gap-3 p-4">
            <span className="text-2xl">{PLAY_STYLES[playStyleType].icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-text-1">{PLAY_STYLES[playStyleType].label}</p>
              <p className="text-[11px] text-text-3 truncate">{PLAY_STYLES[playStyleType].description}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      )}

      {/* 내 기록 요약 카드 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
          <span className="text-base">📋</span>
          내 기록
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => {
            const meta = getStatMeta(stat.type);
            const displayUnit = normalizeStatUnit(stat.type, stat.unit);
            const showUnit = displayUnit.length > 0 && !isTimeStatUnit(displayUnit);
            const diff = stat.previousValue != null ? stat.value - stat.previousValue : null;
            const isBetter = diff != null && meta.lowerIsBetter ? diff < 0 : diff != null && diff > 0;

            return (
              <div
                key={stat.id}
                className={`card-elevated relative overflow-hidden p-4 animate-fade-up ${
                  stat.isPR ? "border border-accent/20" : ""
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {stat.isPR && <div className="card-accent-line" />}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-[11px] font-medium text-text-3">{meta.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-stat text-[24px] font-bold text-text-1 leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatStatValue(stat.value, stat.type, stat.unit)}
                  </span>
                  {showUnit && <span className="text-[11px] text-text-3">{displayUnit}</span>}
                </div>
                {diff != null && (
                  <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isBetter
                      ? "bg-green/10 text-green"
                      : "bg-red/10 text-red"
                  }`}>
                    <span>{isBetter ? "▲" : "▼"}</span>
                    <span>{formatStatDelta(diff, stat.type, stat.unit)}</span>
                  </div>
                )}
                {stat.isPR && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold text-accent"
                    style={{ background: "rgba(212,168,83,0.12)" }}
                  >
                    PR
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 내 위치 (백분위) */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
          <span className="text-base">📊</span>
          내 위치
        </h3>
        <div className="card-elevated divide-y divide-white/[0.06] overflow-hidden">
          {stats.map((stat) => {
            const meta = getStatMeta(stat.type);
            const pct = percentiles[stat.type];
            const hasPercentile = pct != null && !percLoading;

            return (
              <div key={stat.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.icon}</span>
                    <span className="text-[12px] font-medium text-text-2">{meta.label}</span>
                  </div>
                  {hasPercentile && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold text-accent"
                      style={{ background: "rgba(212,168,83,0.12)" }}
                    >
                      상위 {Math.max(1, 100 - pct)}%
                    </span>
                  )}
                </div>
                <div className="relative h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  {hasPercentile && (
                    <>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full animate-grow-w"
                        style={{
                          width: `${pct}%`,
                          background: "var(--accent-gradient)",
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-accent bg-bg shadow-[0_0_6px_rgba(212,168,83,0.4)]"
                        style={{ left: `calc(${pct}% - 6px)` }}
                      />
                    </>
                  )}
                  {percLoading && (
                    <div className="absolute inset-0 rounded-full bg-card-alt animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[10px] text-text-3">
          전체 선수 대비 · 같은 측정 항목 기준
        </p>
      </section>

      {/* 성장 추이 */}
      {stats.some((s) => (s.measureCount ?? 0) > 1) && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
            <span className="text-base">📈</span>
            성장 추이
          </h3>
          <div className="card-elevated overflow-hidden divide-y divide-white/[0.06]">
            {stats
              .filter((s) => (s.measureCount ?? 0) > 1)
              .map((stat) => {
                const meta = getStatMeta(stat.type);
                const displayUnit = normalizeStatUnit(stat.type, stat.unit);
                const isTimeUnit = isTimeStatUnit(displayUnit);
                const improved =
                  stat.firstValue != null
                    ? meta.lowerIsBetter
                      ? stat.value < stat.firstValue
                      : stat.value > stat.firstValue
                    : false;
                const diff = stat.firstValue != null ? Math.abs(stat.value - stat.firstValue) : 0;

                return (
                  <div key={stat.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-[12px] font-medium text-text-2">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-3 font-stat" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatStatValue(stat.firstValue ?? 0, stat.type, stat.unit)}
                        {!isTimeUnit && displayUnit}
                      </span>
                      <svg width="12" height="8" viewBox="0 0 12 8" className="text-text-3">
                        <path d="M0 4h10M8 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-stat text-[14px] font-bold text-text-1" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatStatValue(stat.value, stat.type, stat.unit)}
                        {!isTimeUnit && displayUnit}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        improved ? "bg-green/10 text-green" : "bg-red/10 text-red"
                      }`}>
                        {improved ? "▲" : "▼"}{formatStatDelta(diff, stat.type, stat.unit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            <div className="px-4 py-2.5 bg-white/[0.02]">
              <p className="text-center text-[10px] text-text-3">
                첫 기록 대비 변화량 · 총 {stats[0]?.measureCount ?? 0}회 측정
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 기록 등록 CTA */}
      <div className="flex justify-center pt-1 pb-2">
        <Link
          href="/profile?tab=기록"
          className="action-btn"
        >
          <span>📝</span>
          <span>새 기록 등록하기</span>
        </Link>
      </div>
    </div>
  );
}
