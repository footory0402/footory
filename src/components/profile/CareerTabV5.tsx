"use client";

import React from "react";
import Link from "next/link";
import TournamentTypeBadge from "./TournamentTypeBadge";
import type { Profile, Season, Achievement } from "@/lib/types";

// Tournament record type (matches DB schema)
export interface TournamentRecord {
  id: string;
  name: string;
  type: "공식대회" | "리그" | "친선";
  dateText: string | null;
  result: string | null;
  goals: number;
  assists: number;
  isMvp: boolean;
  source: "team" | "self";
  verifier: string | null;
}

// Award type (matches DB schema)
export interface AwardRecord {
  id: string;
  title: string;
  detail: string | null;
  source: "team" | "self";
  verifier: string | null;
}

interface CareerTabV5Props {
  profile: Profile;
  seasons: Season[];
  tournaments?: TournamentRecord[];
  awards?: AwardRecord[];
  achievements?: Achievement[];
  readOnly?: boolean;
  onAddSeason?: () => void;
  onAddTournament?: () => void;
  onAddAward?: () => void;
}

export default function CareerTabV5({
  profile,
  seasons,
  tournaments = [],
  awards = [],
  achievements = [],
  readOnly,
  onAddSeason,
  onAddTournament,
  onAddAward,
}: CareerTabV5Props) {
  const currentSeason = seasons.find((s) => s.isCurrent);
  const pastSeasons = seasons.filter((s) => !s.isCurrent);

  // Merge old achievements into awards format for display
  const allAwards: AwardRecord[] = [
    ...awards,
    ...achievements.map((a) => ({
      id: a.id,
      title: a.competition ? `${a.competition}${a.year ? ` ${a.year}` : ""}` : a.title,
      detail: a.competition ? a.title : null,
      source: "self" as const,
      verifier: null,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* ── 현재 소속 ── */}
      <CurrentTeamCard profile={profile} readOnly={readOnly} />

      {/* ── 대회 기록 ── */}
      <div>
        <SectionHeader
          title="대회 기록"
          count={tournaments.length}
          right={
            onAddTournament ? (
              <AddButton label="대회 추가" gold onClick={onAddTournament} />
            ) : undefined
          }
        />
        {tournaments.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🏆"
            title="아직 대회 기록이 없어요"
            description="참가한 대회를 기록하면 커리어가 더 돋보여요"
            onAction={onAddTournament}
            actionLabel="대회 추가하기"
          />
        )}
      </div>

      {/* ── 수상 / 성과 ── */}
      <div>
        <SectionHeader
          title="수상 / 성과"
          right={
            onAddAward ? (
              <AddButton label="추가" onClick={onAddAward} />
            ) : undefined
          }
        />
        {allAwards.length > 0 ? (
          <div className="flex flex-col gap-2">
            {allAwards.map((a) => (
              <AwardCard key={a.id} award={a} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🥇"
            title="아직 수상 기록이 없어요"
            description="대회 수상이나 성과를 기록해보세요"
            onAction={onAddAward}
            actionLabel="수상 추가하기"
          />
        )}
      </div>

      {/* ── 소속 이력 ── */}
      <div>
        <SectionHeader
          title="소속 이력"
          right={
            onAddSeason ? (
              <AddButton label="이력 추가" onClick={onAddSeason} />
            ) : undefined
          }
        />
        {(currentSeason || pastSeasons.length > 0) ? (
          <div
            className="card-elevated overflow-hidden"
          >
            {currentSeason && (
              <HistoryRow
                team={currentSeason.teamName}
                period={`${currentSeason.year} ~`}
                current
              />
            )}
            {pastSeasons.map((s) => (
              <HistoryRow
                key={s.id}
                team={s.teamName}
                period={`${s.year}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title="아직 소속 이력이 없어요"
            description="이전 팀 경력을 추가해보세요"
            onAction={onAddSeason}
            actionLabel="이력 추가하기"
          />
        )}
      </div>
    </div>
  );
}

/* ── Current Team Card ── */
function CurrentTeamCard({ profile, readOnly }: { profile: Profile; readOnly?: boolean }) {
  if (!profile.teamName) {
    if (readOnly) {
      return (
        <div
          className="card-elevated"
          style={{ padding: "14px 16px" }}
        >
          <span
            style={{
              fontSize: 9,
              color: "var(--color-text-3)",
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            현재 소속
          </span>
          <div className="mt-2 flex items-center gap-[10px]">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 16,
              }}
            >
              ⚽
            </div>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-3)",
              }}
            >
              소속 팀 없음
            </span>
          </div>
        </div>
      );
    }
    return (
      <Link
        href="/team"
        className="card-elevated block"
        style={{ padding: "14px 16px" }}
      >
        <span
          style={{
            fontSize: 9,
            color: "var(--color-text-3)",
            fontFamily: "var(--font-body)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          현재 소속
        </span>
        <div className="mt-2 flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 16,
            }}
          >
            ⚽
          </div>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-3)",
            }}
          >
            소속 팀 없음
          </span>
          <span
            className="ml-auto"
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
              color: "var(--color-accent)",
              fontSize: 11,
              fontFamily: "var(--font-body)",
            }}
          >
            팀 가입 ›
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div
      className="card-elevated"
      style={{ padding: "14px 16px" }}
    >
      <span
        style={{
          fontSize: 9,
          color: "var(--color-text-3)",
          fontFamily: "var(--font-body)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        현재 소속
      </span>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 16,
            }}
          >
            ⚽
          </div>
          <div>
            <span
              className="block"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-1)",
              }}
            >
              {profile.teamName}
            </span>
          </div>
        </div>
        {profile.teamId && (
          <Link
            href={`/team/${profile.teamId}`}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--color-text-2)",
              fontSize: 11,
              fontFamily: "var(--font-body)",
            }}
          >
            팀 보기 ›
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Tournament Card ── */
function TournamentCard({ tournament: t }: { tournament: TournamentRecord }) {
  const isTeam = t.source === "team";
  const hasPersonal =
    t.goals > 0 || t.assists > 0 || t.isMvp;

  return (
    <div
      className="card-elevated"
      style={{
        padding: 14,
        ...(isTeam && {
          borderColor: "rgba(74,222,128,0.18)",
          backgroundColor: "rgba(74,222,128,0.04)",
        }),
      }}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-[6px]">
            <TournamentTypeBadge type={t.type} />
            {t.dateText && (
              <span
                style={{
                  fontSize: 9,
                  color: "var(--color-text-3)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {t.dateText}
              </span>
            )}
          </div>
          <h3
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-text-1)",
              lineHeight: 1.3,
            }}
          >
            {t.name}
          </h3>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-[10px]">
        {t.result && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 5,
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-accent)",
              fontFamily: "var(--font-body)",
            }}
          >
            {t.result}
          </span>
        )}
        {hasPersonal && (
          <div className="flex gap-[10px]">
            {t.goals > 0 && (
              <span className="flex items-center gap-[3px]">
                <span style={{ fontSize: 11 }}>⚽</span>
                <span
                  style={{
                    fontFamily: "var(--font-stat)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-text-1)",
                  }}
                >
                  {t.goals}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--color-text-3)",
                  }}
                >
                  골
                </span>
              </span>
            )}
            {t.assists > 0 && (
              <span className="flex items-center gap-[3px]">
                <span style={{ fontSize: 11 }}>🅰️</span>
                <span
                  style={{
                    fontFamily: "var(--font-stat)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-text-1)",
                  }}
                >
                  {t.assists}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--color-text-3)",
                  }}
                >
                  도움
                </span>
              </span>
            )}
            {t.isMvp && (
              <span className="flex items-center gap-[3px]">
                <span style={{ fontSize: 11 }}>🏆</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  MVP
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Award Card ── */
function AwardCard({ award: a }: { award: AwardRecord }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "12px 14px",
        background: "rgba(212,168,83,0.08)",
        borderRadius: 12,
        border: "1px solid rgba(212,168,83,0.2)",
        boxShadow: "0 2px 12px rgba(212,168,83,0.06)",
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 16 }}>🥇</span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-text-1)",
          }}
        >
          {a.title}
          {a.detail && (
            <>
              {" · "}
              <span style={{ color: "var(--color-accent)" }}>
                {a.detail}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── History Row ── */
function HistoryRow({
  team,
  period,
  current,
}: {
  team: string;
  period: string;
  current?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-[10px]"
      style={{
        padding: "12px 14px",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div
        className="shrink-0"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: current ? "var(--color-accent)" : "var(--color-text-3)",
        }}
      />
      <span
        className="flex-1"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-1)",
        }}
      >
        {team}
      </span>
      <span
        style={{
          fontFamily: "var(--font-stat)",
          fontSize: 12,
          color: "var(--color-text-3)",
        }}
      >
        {period}
      </span>
    </div>
  );
}

/* ── Section Header (v5) ── */
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

/* ── Add Button (v5) ── */
function AddButton({
  label,
  gold,
  onClick,
}: {
  label: string;
  gold?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        background: gold
          ? "rgba(212,168,83,0.08)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${gold ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.06)"}`,
        color: gold
          ? "var(--color-accent)"
          : "var(--color-text-3)",
        fontSize: 10,
        fontFamily: "var(--font-body)",
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      + {label}
    </button>
  );
}

/* ── Empty State ── */
function EmptyState({
  icon,
  title,
  description,
  onAction,
  actionLabel,
}: {
  icon: string;
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="card-elevated flex flex-col items-center gap-2 py-8 text-center">
      <span className="text-2xl">{icon}</span>
      <p
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-text-1)",
        }}
      >
        {title}
      </p>
      <p
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--color-text-3)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
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
          {actionLabel}
        </button>
      )}
    </div>
  );
}
