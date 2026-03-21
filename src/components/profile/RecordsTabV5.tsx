"use client";

import React from "react";
import VerifyBadge from "./VerifyBadge";
import PlayStyleCard from "@/components/player/PlayStyleCard";
import { getStatMeta } from "@/lib/constants";
import {
  formatStatDelta,
  formatStatValue,
  isTimeStatUnit,
  normalizeStatUnit,
} from "@/lib/stat-display";
import type { Stat, PlayStyle } from "@/lib/types";
import type { PlayStyleType } from "@/lib/constants";
import { PLAY_STYLES } from "@/lib/constants";

interface RecordsTabV5Props {
  stats: Stat[];
  playStyle?: PlayStyle | null;
  onAddStat?: () => void;
  onUpdateStat?: (statType: string) => void;
  onDeleteStat?: (statId: string) => void;
  onPlayStyleTest?: () => void;
}

export default function RecordsTabV5({
  stats,
  playStyle,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
  onPlayStyleTest,
}: RecordsTabV5Props) {
  const growthStats = stats.filter((s) => (s.measureCount ?? 0) > 1);
  const styleInfo = playStyle?.styleType
    ? PLAY_STYLES[playStyle.styleType]
    : null;

  return (
    <div className="pt-4 flex flex-col gap-5">
      {/* ── Play style compact card ── */}
      {styleInfo && playStyle ? (
        <div
          className="flex items-center justify-between"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid var(--v5-card-border)",
            padding: "12px 14px",
          }}
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
                  color: "var(--v5-text)",
                }}
              >
                {styleInfo.label}
              </p>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--v5-text-dim)",
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
              onClick={onPlayStyleTest}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--v5-card-border)",
                color: "var(--v5-text-dim)",
                fontSize: 10,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
              }}
            >
              🔄
            </button>
          )}
        </div>
      ) : onPlayStyleTest ? (
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={onPlayStyleTest}
          style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid var(--v5-card-border)",
            padding: "12px 14px",
          }}
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
                  color: "var(--v5-gold-light)",
                }}
              >
                플레이 스타일을 찾아보세요
              </p>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--v5-text-dim)",
                  marginTop: 1,
                }}
              >
                간단한 질문 5개로 나만의 스타일을 알아보세요
              </p>
            </div>
          </div>
          <span style={{ color: "var(--v5-gold-dim)", fontSize: 14 }}>›</span>
        </div>
      ) : null}

      {/* ── 체력 측정 섹션 ── */}
      <div>
        <SectionHeader
          title="체력 측정"
          right={
            onAddStat ? (
              <button
                onClick={onAddStat}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--v5-gold-bg)",
                  border: "1px solid var(--v5-gold-border)",
                  color: "var(--v5-gold-light)",
                  fontSize: 10,
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                + 기록 추가
              </button>
            ) : undefined
          }
        />

        {/* Verify legend */}
        {stats.length > 0 && (
          <div className="mb-[10px] flex gap-2">
            <VerifyBadge source="team" verifier="팀 인증" compact />
            <VerifyBadge source="self" compact />
          </div>
        )}

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <PhysicalTestCard
                key={stat.id}
                stat={stat}
                onUpdate={onUpdateStat ? () => onUpdateStat(stat.type) : undefined}
                onDelete={onDeleteStat ? () => onDeleteStat(stat.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-3 py-8 text-center"
            style={{
              borderRadius: 12,
              border: "1px solid var(--v5-card-border)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <span className="text-2xl">📊</span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--v5-text)",
              }}
            >
              나의 성장을 기록해보세요
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--v5-text-dim)",
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
                  background: "var(--v5-gold)",
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
          <div
            style={{
              borderRadius: 12,
              border: "1px solid var(--v5-card-border)",
              overflow: "hidden",
            }}
          >
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
                        ? "1px solid var(--v5-card-border)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--v5-text-sub)",
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
                        color: "var(--v5-text)",
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
                            ? "var(--v5-green)"
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
                  color: "var(--v5-text-dim)",
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

/* ── Section Header (v5 style with gold bar) ── */
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
    <div
      className="mb-[10px] flex items-center justify-between"
    >
      <div className="flex items-center gap-[6px]">
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            background: "var(--v5-gold)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--v5-text)",
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "var(--font-stat)",
              fontSize: 11,
              color: "var(--v5-text-dim)",
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

/* ── Physical Test Card (v5 style with verify badge) ── */
function PhysicalTestCard({
  stat,
  onUpdate,
  onDelete,
}: {
  stat: Stat;
  onUpdate?: () => void;
  onDelete?: () => void;
}) {
  const meta = getStatMeta(stat.type);
  const displayUnit = normalizeStatUnit(stat.type, stat.unit);
  const isTime = isTimeStatUnit(displayUnit);

  const diff =
    stat.previousValue != null ? stat.value - stat.previousValue : null;
  const improved =
    diff != null && diff !== 0 && (meta.lowerIsBetter ? diff < 0 : diff > 0);

  // For now all existing stats are "self" since team verification doesn't exist yet
  const source: "team" | "self" = stat.verified ? "team" : "self";
  const isTeam = source === "team";

  const measuredDate = stat.measuredAt
    ? (() => {
        const d = new Date(stat.measuredAt);
        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
      })()
    : "";

  return (
    <div
      className="relative"
      style={{
        borderRadius: 12,
        padding: "12px 12px 10px",
        background: isTeam
          ? "rgba(74,222,128,0.015)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${isTeam ? "var(--v5-green-border)" : "var(--v5-card-border)"}`,
      }}
      onClick={onUpdate}
      role={onUpdate ? "button" : undefined}
      tabIndex={onUpdate ? 0 : undefined}
    >
      {/* Header: label + date */}
      <div
        className="mb-[6px] flex items-center justify-between"
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--v5-text-sub)",
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--v5-text-dim)",
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
            color: "var(--v5-text)",
            lineHeight: 1,
          }}
        >
          {formatStatValue(stat.value, stat.type, stat.unit)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "var(--v5-text-dim)",
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
              color: improved ? "var(--v5-green)" : "var(--color-red)",
            }}
          >
            {improved ? "↑" : "↓"}
            {formatStatDelta(Math.abs(diff), stat.type, stat.unit)}
          </span>
        )}
      </div>

      {/* Verify badge */}
      <VerifyBadge source={source} compact />

      {/* Delete button (long press or tap, small) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity hover:opacity-100"
          style={{
            background: "rgba(248,113,113,0.15)",
            color: "var(--color-red)",
          }}
          aria-label="기록 삭제"
        >
          <svg
            width="8"
            height="8"
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
