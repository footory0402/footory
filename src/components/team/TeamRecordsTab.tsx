"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import { getStatMeta } from "@/lib/constants";

interface TeamMemberStat {
  profileId: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  position?: string;
  statType: string;
  value: number;
  unit: string;
  recordedAt: string;
}

interface TeamAvgStat {
  statType: string;
  avg: number;
  count: number;
  best: { value: number; name: string };
}

export default function TeamRecordsTab({ teamId }: { teamId: string }) {
  const [avgStats, setAvgStats] = useState<TeamAvgStat[]>([]);
  const [recentRecords, setRecentRecords] = useState<TeamMemberStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${teamId}/records`)
      .then((r) => (r.ok ? r.json() : { avgStats: [], recentRecords: [] }))
      .then((data) => {
        setAvgStats(data.avgStats ?? []);
        setRecentRecords(data.recentRecords ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-elevated shrink-0 w-[150px] p-4 h-[100px]" />
          ))}
        </div>
        <div className="card-elevated overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-4 py-3.5">
              <div className="h-4 w-full rounded bg-card-alt" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (avgStats.length === 0 && recentRecords.length === 0) {
    return (
      <div className="py-10 text-center animate-fade-up">
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-accent/5" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-[0_0_20px_rgba(212,168,83,0.1)]">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        <p className="text-[14px] font-bold text-text-1">아직 팀 기록이 없어요</p>
        <p className="mt-1.5 text-[12px] text-text-3 leading-relaxed">
          팀원들이 기록을 등록하면 여기에 표시돼요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 팀 평균 스탯 — 수평 스크롤 카드 */}
      {avgStats.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
            <span className="text-base">📊</span>
            팀 평균
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {avgStats.map((stat, idx) => {
              const meta = getStatMeta(stat.statType);
              return (
                <div
                  key={stat.statType}
                  className="card-elevated shrink-0 w-[150px] p-4 animate-fade-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-sm">{meta.icon}</span>
                    <span className="text-[11px] font-medium text-text-3">{meta.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-stat text-[22px] font-bold text-text-1 leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {stat.avg.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-text-3">{meta.unit}</span>
                  </div>
                  <p className="mt-2 text-[10px] text-text-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                      style={{ background: "rgba(212,168,83,0.08)", color: "var(--color-accent)" }}
                    >
                      {stat.count}명 측정
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 팀 내 기록왕 */}
      {avgStats.length > 0 && avgStats.some((s) => s.best) && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
            <span className="text-base">🏅</span>
            기록왕
          </h3>
          <div className="card-elevated divide-y divide-white/[0.06] overflow-hidden">
            {avgStats
              .filter((s) => s.best)
              .map((stat) => {
                const meta = getStatMeta(stat.statType);
                return (
                  <div key={stat.statType} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-[12px] font-medium text-text-2">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[12px] font-semibold text-text-1">
                        {stat.best.name}
                      </span>
                      <span
                        className="inline-flex items-baseline gap-0.5 rounded-full px-2 py-0.5 font-stat text-[13px] font-bold"
                        style={{ background: "rgba(212,168,83,0.12)", color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}
                      >
                        {stat.best.value}{meta.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 팀원 최근 기록 */}
      {recentRecords.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-text-2">
            <span className="text-base">📋</span>
            최근 기록
          </h3>
          <div className="space-y-2">
            {recentRecords.map((record, i) => {
              const meta = getStatMeta(record.statType);
              const date = new Date(record.recordedAt);
              const ago = getRelativeTime(date);

              return (
                <div
                  key={`${record.profileId}-${record.statType}-${i}`}
                  className="card-elevated flex items-center gap-3 p-3 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Avatar name={record.name} imageUrl={record.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-text-1 truncate">{record.name}</span>
                      <span className="text-[10px] text-text-3 shrink-0">{ago}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-3">
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                      <span
                        className="font-stat font-bold"
                        style={{ color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}
                      >
                        {record.value}{meta.unit}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}
