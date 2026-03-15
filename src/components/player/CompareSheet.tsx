"use client";

import { useState, useEffect, useMemo } from "react";
import Avatar from "@/components/ui/Avatar";
import RadarChart from "./RadarChart";
import { MEASUREMENTS, getStatMeta, RADAR_STATS, POSITION_COLORS, type RadarStatId, type Position } from "@/lib/constants";
import { calcRadarStats, EMPTY_RADAR_STATS, type ClipTagCount } from "@/lib/radar-calc";
import type { Profile, Stat } from "@/lib/types";

interface CompareSheetProps {
  open: boolean;
  onClose: () => void;
  /** 비교 대상 선수 */
  target: {
    profile: Profile;
    stats: Stat[];
    radarStats: Record<RadarStatId, number>;
  };
}

interface MyData {
  profile: Profile | null;
  stats: Stat[];
  radarStats: Record<RadarStatId, number>;
  loading: boolean;
}

export default function CompareSheet({ open, onClose, target }: CompareSheetProps) {
  const [myData, setMyData] = useState<MyData>({
    profile: null,
    stats: [],
    radarStats: EMPTY_RADAR_STATS,
    loading: true,
  });

  // Fetch my data on open
  useEffect(() => {
    if (!open) return;

    async function fetchMyData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/profile/me"),
          fetch("/api/stats"),
        ]);

        if (!profileRes.ok || !statsRes.ok) {
          setMyData((prev) => ({ ...prev, loading: false }));
          return;
        }

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();

        const profile: Profile = {
          id: profileData.id,
          handle: profileData.handle,
          name: profileData.name,
          position: profileData.position ?? "FW",
          birthYear: profileData.birth_year,
          city: profileData.city,
          avatarUrl: profileData.avatar_url,
          followers: profileData.followers_count ?? 0,
          following: profileData.following_count ?? 0,
          views: profileData.views_count ?? 0,
          contactPublic: false,
          role: profileData.role ?? "player",
          isVerified: !!profileData.is_verified,
          mvpCount: profileData.mvp_count ?? 0,
          mvpTier: profileData.mvp_tier ?? null,
          createdAt: profileData.created_at,
        };

        const stats: Stat[] = (statsData.stats ?? []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          playerId: s.profile_id as string,
          type: s.stat_type as string,
          value: s.value as number,
          unit: s.unit as string,
          measuredAt: s.recorded_at as string,
          verified: (s.verified as boolean) ?? false,
        }));

        // Dedupe: keep latest per stat type
        const latestByType = new Map<string, Stat>();
        for (const s of stats) {
          if (!latestByType.has(s.type)) latestByType.set(s.type, s);
        }
        const dedupedStats = [...latestByType.values()];

        const radarStats = calcRadarStats(dedupedStats, []);

        setMyData({ profile, stats: dedupedStats, radarStats, loading: false });
      } catch {
        setMyData((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchMyData();
  }, [open]);

  // Find shared stat types
  const sharedStats = useMemo(() => {
    if (!myData.profile) return [];

    const myStatMap = new Map(myData.stats.map((s) => [s.type, s]));
    const targetStatMap = new Map(target.stats.map((s) => [s.type, s]));

    const shared: { type: string; label: string; unit: string; myValue: number; targetValue: number; lowerIsBetter: boolean }[] = [];

    for (const m of MEASUREMENTS) {
      const myStat = myStatMap.get(m.id);
      const targetStat = targetStatMap.get(m.id);
      if (myStat && targetStat) {
        shared.push({
          type: m.id,
          label: m.label,
          unit: m.unit,
          myValue: myStat.value,
          targetValue: targetStat.value,
          lowerIsBetter: m.lowerIsBetter,
        });
      }
    }

    return shared;
  }, [myData.stats, target.stats]);

  // Count advantages
  const { myAdvantages, targetAdvantages } = useMemo(() => {
    let my = 0;
    let their = 0;
    for (const s of sharedStats) {
      if (s.lowerIsBetter) {
        if (s.myValue < s.targetValue) my++;
        else if (s.myValue > s.targetValue) their++;
      } else {
        if (s.myValue > s.targetValue) my++;
        else if (s.myValue < s.targetValue) their++;
      }
    }
    return { myAdvantages: my, targetAdvantages: their };
  }, [sharedStats]);

  if (!open) return null;

  const myProfile = myData.profile;
  const targetProfile = target.profile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-elevated animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-elevated">
          <div className="h-1 w-8 rounded-full bg-white/20" />
        </div>

        {myData.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : !myProfile ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[14px] text-text-2">로그인이 필요합니다</p>
            <button onClick={onClose} className="mt-4 rounded-xl bg-accent px-6 py-2.5 text-[13px] font-bold text-bg">
              닫기
            </button>
          </div>
        ) : (
          <div className="px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
            {/* Header: Me vs Target */}
            <div className="flex items-center justify-between py-4">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <Avatar name={myProfile.name} size="lg" imageUrl={myProfile.avatarUrl} />
                <span className="text-[13px] font-bold text-text-1 truncate max-w-[100px]">{myProfile.name}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: POSITION_COLORS[(myProfile.position ?? "FW") as Position] }}
                >
                  {myProfile.position}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 shrink-0 mx-2">
                <span className="text-[20px] font-bold text-accent font-stat">VS</span>
                {sharedStats.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] font-bold text-accent">{myAdvantages}</span>
                    <span className="text-[9px] text-text-3">-</span>
                    <span className="text-[11px] font-bold text-text-3">{targetAdvantages}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-1">
                <Avatar name={targetProfile.name} size="lg" imageUrl={targetProfile.avatarUrl} />
                <span className="text-[13px] font-bold text-text-1 truncate max-w-[100px]">{targetProfile.name}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: POSITION_COLORS[(targetProfile.position ?? "FW") as Position] }}
                >
                  {targetProfile.position}
                </span>
              </div>
            </div>

            {/* Radar Overlay */}
            <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden mb-4">
              <div className="px-4 pt-4 pb-2">
                <RadarChart
                  stats={myData.radarStats}
                  compareStats={target.radarStats}
                  compareLabel={targetProfile.name}
                  showOverall
                  size={260}
                />
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 px-4 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#D4A853]" />
                  <span className="text-[10px] font-semibold text-text-2">{myProfile.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="text-[10px] font-semibold text-text-3">{targetProfile.name}</span>
                </div>
              </div>
            </div>

            {/* Bidirectional Stat Bars */}
            {sharedStats.length > 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden mb-4">
                <div className="px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-3 mb-3">
                    상세 비교
                  </p>
                  <div className="flex flex-col gap-3.5">
                    {sharedStats.map((stat) => {
                      const isMeWinning = stat.lowerIsBetter
                        ? stat.myValue < stat.targetValue
                        : stat.myValue > stat.targetValue;
                      const isTie = stat.myValue === stat.targetValue;

                      // Compute bar widths (relative to max of the two)
                      const maxVal = Math.max(stat.myValue, stat.targetValue) || 1;
                      const myPct = (stat.myValue / maxVal) * 100;
                      const targetPct = (stat.targetValue / maxVal) * 100;

                      return (
                        <div key={stat.type}>
                          {/* Label */}
                          <p className="text-[11px] font-semibold text-text-2 mb-1.5 text-center">{stat.label}</p>
                          {/* Bars */}
                          <div className="flex items-center gap-2">
                            {/* My value */}
                            <span
                              className="w-14 text-right font-stat text-[14px] font-bold tabular-nums shrink-0"
                              style={{ color: isMeWinning && !isTie ? "#D4A853" : "#71717A" }}
                            >
                              {stat.myValue}{stat.unit !== "분:초" ? stat.unit : ""}
                            </span>
                            {/* My bar (right-aligned, grows left) */}
                            <div className="flex-1 flex justify-end">
                              <div className="w-full h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ml-auto"
                                  style={{
                                    width: `${myPct}%`,
                                    background: isMeWinning && !isTie
                                      ? "linear-gradient(90deg, rgba(212,168,83,0.3), #D4A853)"
                                      : "rgba(255,255,255,0.15)",
                                  }}
                                />
                              </div>
                            </div>
                            {/* Divider */}
                            <div className="w-px h-4 bg-white/10 shrink-0" />
                            {/* Target bar (left-aligned, grows right) */}
                            <div className="flex-1">
                              <div className="w-full h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${targetPct}%`,
                                    background: !isMeWinning && !isTie
                                      ? "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.35))"
                                      : "rgba(255,255,255,0.15)",
                                  }}
                                />
                              </div>
                            </div>
                            {/* Target value */}
                            <span
                              className="w-14 text-left font-stat text-[14px] font-bold tabular-nums shrink-0"
                              style={{ color: !isMeWinning && !isTie ? "#A1A1AA" : "#71717A" }}
                            >
                              {stat.targetValue}{stat.unit !== "분:초" ? stat.unit : ""}
                            </span>
                          </div>
                          {/* Winner indicator */}
                          {!isTie && (
                            <div className={`flex mt-1 ${isMeWinning ? "justify-start pl-14" : "justify-end pr-14"}`}>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: isMeWinning ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.06)",
                                  color: isMeWinning ? "#D4A853" : "#71717A",
                                }}
                              >
                                {isMeWinning ? "내가 더 잘하는 것" : "상대가 더 잘하는 것"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-card px-4 py-8 text-center mb-4">
                <p className="text-[13px] text-text-3">
                  공통 기록이 없어 상세 비교가 불가능해요
                </p>
                <p className="text-[11px] text-text-3 mt-1">
                  레이더 차트로만 비교할 수 있어요
                </p>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-white/[0.07] py-3.5 text-[13px] font-bold text-text-2 transition-colors active:bg-white/[0.12]"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
