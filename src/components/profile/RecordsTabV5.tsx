"use client";

import React, { useState } from "react";
import { getStatMeta, getPercentileTier } from "@/lib/constants";
import {
  formatStatDelta,
  formatStatValue,
  isTimeStatUnit,
  normalizeStatUnit,
} from "@/lib/stat-display";
import type { Stat, PlayStyle } from "@/lib/types";
import { PLAY_STYLES } from "@/lib/constants";

interface RecordsTabV5Props {
  stats: Stat[];
  playStyle?: PlayStyle | null;
  onAddStat?: () => void;
  onUpdateStat?: (statType: string, statId: string) => void;
  onDeleteStat?: (statId: string) => void;
  onPlayStyleTest?: () => void;
  percentiles?: Record<string, number>;
  ageAvgs?: Record<string, number>;
  peerCounts?: Record<string, number>;
  ageGroup?: string;
  percentileLoading?: boolean;
}

export default function RecordsTabV5({
  stats,
  playStyle,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
  onPlayStyleTest,
  percentiles,
  ageAvgs,
  peerCounts,
  percentileLoading,
}: RecordsTabV5Props) {
  const [isEditMode, setIsEditMode] = useState(false);

  const growthStats = stats.filter((s) => (s.measureCount ?? 0) > 1);
  const styleInfo = playStyle?.styleType
    ? PLAY_STYLES[playStyle.styleType]
    : null;

  return (
    <div className="pt-3 flex flex-col gap-4">
      {/* 탭 설명 (스탯 없을 때) */}
      {stats.length === 0 && (
        <p style={{ fontSize: 11, color: "var(--color-text-3)", fontFamily: "var(--font-body)", margin: "0 0 4px", paddingLeft: 2 }}>
          50m 달리기, 슈팅 속도 등 신체능력 수치를 기록해요
        </p>
      )}

      {/* 빈 상태 빠른 추가 카드 */}
      {onAddStat && stats.length === 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-2)", fontFamily: "var(--font-body)", marginBottom: 10 }}>
            기록해볼 항목
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["sprint_50m", "kick_power", "juggling", "sargent_jump"].map((statType) => {
              const meta = getStatMeta(statType);
              return (
                <button
                  key={statType}
                  onClick={() => onAddStat?.()}
                  style={{
                    padding: "12px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                    background: "var(--color-card)", border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-1)", fontFamily: "var(--font-body)", marginBottom: 2 }}>
                    {meta.label}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
                    {meta.unit} · 탭하여 기록
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 플레이 스타일 카드 ── */}
      {styleInfo && playStyle ? (
        <div
          className="card-elevated flex items-center justify-between"
          style={{ padding: "12px 14px", cursor: onPlayStyleTest ? "pointer" : undefined }}
          onClick={onPlayStyleTest}
        >
          <div className="flex items-center gap-[10px]">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(250,204,21,0.06)",
                fontSize: 16,
              }}
            >
              {styleInfo.icon}
            </div>
            <div>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-1)",
                }}
              >
                {styleInfo.label}
              </p>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--color-text-3)",
                  marginTop: 1,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{styleInfo.description}&rdquo;
              </p>
            </div>
          </div>
          {onPlayStyleTest && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlayStyleTest(); }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(212,168,83,0.08)",
                border: "1px solid rgba(212,168,83,0.20)",
                color: "var(--color-accent)",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                minHeight: 32,
                whiteSpace: "nowrap",
              }}
            >
              다시 테스트
            </button>
          )}
        </div>
      ) : onPlayStyleTest ? (
        <div
          className="card-elevated flex items-center justify-between cursor-pointer"
          onClick={onPlayStyleTest}
          style={{ padding: "12px 14px" }}
        >
          <div className="flex items-center gap-[10px]">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(250,204,21,0.06)",
                fontSize: 16,
              }}
            >
              ⚡
            </div>
            <div>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-accent)",
                }}
              >
                플레이 스타일을 찾아보세요
              </p>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--color-text-3)",
                  marginTop: 1,
                }}
              >
                간단한 질문 5개로 나만의 스타일을 알아보세요
              </p>
            </div>
          </div>
          <span style={{ color: "var(--color-accent)", fontSize: 14 }}>›</span>
        </div>
      ) : null}

      {/* ── 체력 측정 섹션 ── */}
      <div>
        <SectionHeader
          title="체력 측정"
          right={
            onAddStat || onDeleteStat ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {onAddStat && !isEditMode && (
                  <button
                    onClick={onAddStat}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "rgba(212,168,83,0.08)",
                      border: "1px solid rgba(212,168,83,0.2)",
                      color: "var(--color-accent)",
                      fontSize: 10,
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    + 기록 추가
                  </button>
                )}
                {/* 편집 / 완료 토글 — 기록이 있고 삭제 가능할 때만 표시 */}
                {onDeleteStat && stats.length > 0 && (
                  <button
                    onClick={() => setIsEditMode((v) => !v)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: isEditMode
                        ? "rgba(212,168,83,0.12)"
                        : "rgba(255,255,255,0.04)",
                      border: isEditMode
                        ? "1px solid rgba(212,168,83,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: isEditMode
                        ? "var(--color-accent)"
                        : "var(--color-text-3)",
                      fontSize: 10,
                      fontFamily: "var(--font-body)",
                      fontWeight: isEditMode ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {isEditMode ? "완료" : "편집"}
                  </button>
                )}
              </div>
            ) : undefined
          }
        />


        {/* 편집 모드 안내 */}
        {isEditMode && stats.length > 0 && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(248,113,113,0.7)",
              marginBottom: 10,
              marginTop: 0,
              letterSpacing: "-0.01em",
            }}
          >
            삭제할 기록의 × 버튼을 탭하세요
          </p>
        )}

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <PhysicalTestCard
                key={stat.id}
                stat={stat}
                isEditMode={isEditMode}
                onUpdate={!isEditMode && onUpdateStat ? () => onUpdateStat(stat.type, stat.id) : undefined}
                onDelete={isEditMode && onDeleteStat ? () => onDeleteStat(stat.id) : undefined}
                percentile={percentiles?.[stat.type]}
                ageAvg={ageAvgs?.[stat.type]}
                peerCount={peerCounts?.[stat.type]}
                percentileLoading={percentileLoading}
              />
            ))}
          </div>
        ) : (
          <div
            className="card-elevated flex flex-col items-center gap-3 py-8 text-center"
          >
            <span className="text-2xl">📊</span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text-1)",
              }}
            >
              나의 성장을 기록해보세요
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--color-text-3)",
                lineHeight: 1.5,
              }}
            >
              50m 달리기, 리프팅, 킥 속도 등을 기록하면
              <br />
              과거의 나와 비교하며 성장을 확인할 수 있어요
            </p>
            {onAddStat && (
              <button
                onClick={onAddStat}
                className="mt-1"
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: "var(--color-accent)",
                  color: "#000",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                첫 기록 시작하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 성장 추이 섹션 ── */}
      {growthStats.length > 0 && (
        <div>
          <SectionHeader title="성장 추이" />
          <div className="card-elevated overflow-hidden">
            {growthStats.map((stat, i) => {
              const meta = getStatMeta(stat.type);
              const displayUnit = normalizeStatUnit(stat.type, stat.unit);
              const isTime = isTimeStatUnit(displayUnit);
              const diff =
                stat.firstValue != null
                  ? Math.abs(stat.value - stat.firstValue)
                  : 0;
              const improved =
                stat.firstValue != null
                  ? meta.lowerIsBetter
                    ? stat.value < stat.firstValue
                    : stat.value > stat.firstValue
                  : false;

              return (
                <div
                  key={stat.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: "11px 14px",
                    background: "rgba(255,255,255,0.015)",
                    borderBottom:
                      i < growthStats.length - 1
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--color-text-2)",
                    }}
                  >
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-stat)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text-1)",
                      }}
                    >
                      {formatStatValue(stat.value, stat.type, stat.unit)}
                      {!isTime && displayUnit}
                    </span>
                    {diff > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-stat)",
                          fontWeight: 600,
                          color: improved
                            ? "var(--color-green)"
                            : "var(--color-red)",
                          background: improved
                            ? "rgba(74,222,128,0.08)"
                            : "rgba(248,113,113,0.08)",
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {improved ? "▲" : "▼"}
                        {formatStatDelta(diff, stat.type, stat.unit)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "6px 14px", textAlign: "center" }}>
              <span
                style={{
                  fontSize: 9,
                  color: "var(--color-text-3)",
                  fontFamily: "var(--font-body)",
                }}
              >
                첫 기록 대비 변화량
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({
  title,
  count,
  right,
}: {
  title: string;
  count?: number;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-[10px] flex items-center justify-between">
      <div className="flex items-center gap-[6px]">
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            background: "var(--color-accent)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--color-text-1)",
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "var(--font-stat)",
              fontSize: 11,
              color: "var(--color-text-3)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: "1px 7px",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

/* ── Physical Test Card ── */
function PhysicalTestCard({
  stat,
  isEditMode,
  onUpdate,
  onDelete,
  percentile,
  ageAvg,
  peerCount,
  percentileLoading,
}: {
  stat: Stat;
  isEditMode: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
  percentile?: number;
  ageAvg?: number;
  peerCount?: number;
  percentileLoading?: boolean;
}) {
  const meta = getStatMeta(stat.type);
  const displayUnit = normalizeStatUnit(stat.type, stat.unit);
  const isTime = isTimeStatUnit(displayUnit);

  const diff =
    stat.previousValue != null ? stat.value - stat.previousValue : null;
  const improved =
    diff != null && diff !== 0 && (meta.lowerIsBetter ? diff < 0 : diff > 0);

  const source: "team" | "self" = stat.verified ? "team" : "self";
  const isTeam = source === "team";

  const tier = percentile != null ? getPercentileTier(percentile) : null;
  const showPercentile = !percentileLoading && percentile != null && (peerCount == null || peerCount >= 3);

  const measuredDate = stat.measuredAt
    ? (() => {
        const d = new Date(stat.measuredAt);
        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
      })()
    : "";

  return (
    <div
      className="card-elevated relative"
      style={{
        padding: "12px 12px 10px",
        cursor: onUpdate ? "pointer" : "default",
        transition: "background 0.15s, transform 0.15s",
        ...(isTeam && {
          borderColor: "rgba(74,222,128,0.18)",
          backgroundColor: "rgba(74,222,128,0.04)",
        }),
        ...(isEditMode && {
          borderColor: "rgba(248,113,113,0.15)",
        }),
      }}
      onClick={onUpdate}
      role={onUpdate ? "button" : undefined}
      tabIndex={onUpdate ? 0 : undefined}
    >
      {/* Header: label + date */}
      <div className="mb-[6px] flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-2)",
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--color-text-3)",
            fontFamily: "var(--font-body)",
          }}
        >
          {measuredDate}
        </span>
      </div>

      {/* Value */}
      <div className="mb-2 flex items-baseline gap-[3px]">
        <span
          style={{
            fontFamily: "var(--font-stat)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--color-text-1)",
            lineHeight: 1,
          }}
        >
          {formatStatValue(stat.value, stat.type, stat.unit)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "var(--color-text-3)",
          }}
        >
          {!isTime && displayUnit}
        </span>
        {diff != null && diff !== 0 && (
          <span
            className="ml-[2px]"
            style={{
              fontSize: 10,
              fontFamily: "var(--font-stat)",
              color: improved ? "var(--color-green)" : "var(--color-red)",
            }}
          >
            {improved ? "↑" : "↓"}
            {formatStatDelta(Math.abs(diff), stat.type, stat.unit)}
          </span>
        )}
      </div>


      {/* ── 퍼센타일 섹션 ── */}
      {percentileLoading ? (
        /* 로딩 shimmer */
        <div
          className="animate-pulse rounded-full"
          style={{ height: 7, background: "rgba(255,255,255,0.08)", marginTop: 8 }}
        />
      ) : peerCount != null && peerCount < 3 ? (
        /* 데이터 부족 */
        <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "var(--color-text-3)", marginTop: 8, marginBottom: 0 }}>
          데이터 수집 중
        </p>
      ) : showPercentile ? (
        <div style={{ marginTop: 8 }}>
          {/* 바 + 뱃지 행 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* 퍼센타일 바 */}
            <div style={{ flex: 1, position: "relative", height: 7, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "visible" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  width: `${percentile}%`,
                  background: tier
                    ? (tier.color === "#D4A853"
                        ? "linear-gradient(90deg, #D4A853, #F5C542)"
                        : "linear-gradient(90deg, rgba(161,161,170,0.5), rgba(161,161,170,0.7))")
                    : "linear-gradient(90deg, rgba(74,222,128,0.3), rgba(74,222,128,0.5))",
                  boxShadow: tier?.color === "#D4A853" ? "0 0 6px rgba(212,168,83,0.4)" : "none",
                }}
              />
              {/* 평균 마커 (50%) */}
              <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 1, height: 15, borderLeft: "1px dashed rgba(161,161,170,0.4)" }} />
            </div>
            {/* 등급 뱃지 */}
            {tier ? (
              <span
                style={{
                  flexShrink: 0,
                  borderRadius: 999,
                  padding: "2px 7px",
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  background: tier.color === "#D4A853"
                    ? "rgba(212,168,83,0.15)"
                    : "rgba(161,161,170,0.10)",
                  color: tier.color,
                  border: tier.color === "#D4A853"
                    ? "1px solid rgba(212,168,83,0.3)"
                    : "1px solid rgba(161,161,170,0.2)",
                  whiteSpace: "nowrap",
                }}
              >
                {tier.emoji} {tier.label}
              </span>
            ) : (
              <span style={{ flexShrink: 0, fontSize: 9, fontFamily: "var(--font-body)", color: "#4ADE80" }}>
                성장 중
              </span>
            )}
          </div>
          {/* 동나이 평균 비교 텍스트 */}
          <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "var(--color-text-3)", marginTop: 4, marginBottom: 0 }}>
            {ageAvg != null && (
              <>동나이 평균 {formatStatValue(ageAvg, stat.type, stat.unit)}{!isTime && displayUnit} · </>
            )}
            상위 {Math.max(1, 100 - percentile!)}%
          </p>
        </div>
      ) : null}

      {/* 탭하여 업데이트 힌트 — 일반 모드에서만 */}
      {onUpdate && !isEditMode && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 9,
            color: "rgba(255,255,255,0.20)",
            textAlign: "right",
            marginTop: 4,
            marginBottom: 0,
            letterSpacing: "-0.01em",
          }}
        >
          탭하여 업데이트
        </p>
      )}

      {/* 삭제 버튼 — 편집 모드에서만 표시 */}
      {isEditMode && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-opacity active:scale-95"
          style={{
            background: "rgba(248,113,113,0.20)",
            border: "1px solid rgba(248,113,113,0.30)",
            color: "var(--color-red)",
          }}
          aria-label="기록 삭제"
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
