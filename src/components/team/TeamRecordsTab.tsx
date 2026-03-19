"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import { getStatMeta } from "@/lib/constants";
import { formatStatValue, isTimeStatUnit, normalizeStatUnit } from "@/lib/stat-display";

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
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card h-[100px]" />
          ))}
        </div>
        <div className="rounded-2xl bg-card h-[200px]" />
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
      {/* 팀 평균 스탯 — GrowthCard 스타일 2열 그리드 */}
      {avgStats.length > 0 && (
        <section>
          <SectionHeader icon="📊" title="팀 평균" count={avgStats.length} />
          <div className="grid grid-cols-2 gap-2">
            {avgStats.map((stat, idx) => {
              const meta = getStatMeta(stat.statType);
              const displayUnit = normalizeStatUnit(stat.statType, meta.unit);
              const isTime = isTimeStatUnit(displayUnit);
              return (
                <div
                  key={stat.statType}
                  className="overflow-hidden rounded-2xl bg-card animate-fade-up"
                  style={{
                    border: "1px solid var(--white-06)",
                    boxShadow: "inset 3px 0 0 var(--white-08)",
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-3 truncate">
                        {meta.label}
                      </p>
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: "rgba(212,168,83,0.08)", color: "var(--color-accent)" }}
                      >
                        {stat.count}명
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-stat leading-none tabular-nums"
                        style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-1)", letterSpacing: "-0.5px" }}
                      >
                        {formatStatValue(stat.avg, stat.statType, meta.unit)}
                      </span>
                      {!isTime && displayUnit && (
                        <span className="text-[11px] text-text-3 font-medium">{displayUnit}</span>
                      )}
                    </div>
                    {/* 기록왕 인라인 */}
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-[10px]">👑</span>
                      <span className="text-[10px] font-semibold text-accent">{stat.best.name}</span>
                      <span className="font-stat text-[10px] font-bold text-text-2 tabular-nums ml-auto">
                        {formatStatValue(stat.best.value, stat.statType, meta.unit)}
                        {!isTime && displayUnit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 최근 기록 — 성장 추이 스타일 */}
      {recentRecords.length > 0 && (
        <section>
          <SectionHeader icon="📋" title="최근 기록" />
          <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden divide-y divide-white/[0.05]">
            {recentRecords.map((record, i) => {
              const meta = getStatMeta(record.statType);
              const displayUnit = normalizeStatUnit(record.statType, record.unit || meta.unit);
              const isTime = isTimeStatUnit(displayUnit);
              const ago = getRelativeTime(new Date(record.recordedAt));

              return (
                <div
                  key={`${record.profileId}-${record.statType}-${i}`}
                  className="flex items-center gap-3 px-4 py-3 animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Avatar name={record.name} imageUrl={record.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-text-1 truncate">{record.name}</span>
                      <span className="text-[10px] text-text-3 shrink-0">{ago}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[11px]">{meta.icon}</span>
                      <span className="text-[11px] text-text-3">{meta.label}</span>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1 font-stat text-[14px] font-bold tabular-nums"
                    style={{
                      background: "rgba(212,168,83,0.10)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {formatStatValue(record.value, record.statType, record.unit || meta.unit)}
                    {!isTime && displayUnit && (
                      <span className="text-[10px] font-medium">{displayUnit}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── 섹션 헤더 (InfoTab 패턴과 동일) ── */
function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-[3px] rounded-full bg-accent shrink-0" />
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[14px] font-bold text-text-1">{title}</span>
        </span>
        {count != null && count > 0 && (
          <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
            {count}
          </span>
        )}
      </div>
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
