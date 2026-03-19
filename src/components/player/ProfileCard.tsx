"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import ProfileRadar from "@/components/player/ProfileRadar";
import ProfileStatList from "@/components/player/ProfileStatList";
import { EMPTY_RADAR_STATS } from "@/lib/radar-calc";
import type { Profile, Stat } from "@/lib/types";
import type { RadarStatId } from "@/lib/constants";

interface ProfileCardProps {
  profile: Profile;
  radarStats?: Record<RadarStatId, number>; // RadarStatId -> 0~99
  stats?: Stat[];                            // 원본 측정 데이터
  onEdit?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onAddStat?: () => void;                    // 빈 상태 CTA 클릭
}

function ProfileCard({
  profile,
  radarStats,
  stats,
  onEdit,
  onAvatarUpload,
  onAddStat,
}: ProfileCardProps) {
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarUpload) return;
    setAvatarUploading(true);
    try {
      await onAvatarUpload(file);
      toast("프로필 사진이 변경되었습니다", "success");
    } catch {
      toast("프로필 사진 업로드에 실패했습니다", "error");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  // 프로필 완성도 안내
  const missingItems: { label: string; action: string }[] = [];
  if (onEdit) {
    if (!profile.avatarUrl) missingItems.push({ label: "프로필 사진", action: "avatar" });
    if (!profile.position) missingItems.push({ label: "포지션", action: "edit" });
    if (!profile.birthYear) missingItems.push({ label: "출생연도", action: "edit" });
  }

  const preferredFootLabel =
    profile.preferredFoot === "right" ? "오른발"
    : profile.preferredFoot === "left" ? "왼발"
    : profile.preferredFoot === "both" ? "양발"
    : profile.preferredFoot ?? null;

  const resolvedRadarStats = radarStats ?? EMPTY_RADAR_STATS;
  const hasAnyStats = Object.values(resolvedRadarStats).some((v) => v > 0);
  const safeAvatarUrl = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : undefined;

  return (
    /* 외부 래퍼 — fade-up 애니메이션 */
    <div className="relative" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>

      {/* 골드 conic-gradient 보더 */}
      <div
        className="absolute -inset-[2px] rounded-[18px]"
        style={{
          background: `conic-gradient(from 0deg, rgba(245,197,66,0.5) 0deg, rgba(212,168,83,0.08) 60deg, rgba(139,105,20,0.2) 120deg, rgba(212,168,83,0.08) 180deg, rgba(245,215,142,0.45) 240deg, rgba(212,168,83,0.1) 300deg, rgba(245,197,66,0.5) 360deg)`,
        }}
      />

      {/* 내부 카드 */}
      <div
        className="relative z-[1] overflow-hidden rounded-2xl bg-[#0A0A0C]"
        style={{
          boxShadow:
            "0 0 50px rgba(212,168,83,0.05), inset 0 1px 0 rgba(245,215,142,0.08)",
        }}
      >
        {/* 필름 그레인 오버레이 */}
        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* ── 사진 영역 ── */}
        <div className="relative h-[280px] overflow-hidden">
          {/* 배경: radial-gradient 골드 + pitch line 패턴 */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 60% 30%, rgba(212,168,83,0.12) 0%, transparent 60%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px)`,
            }}
          />

          {/* 아바타 이미지 */}
          {safeAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeAvatarUrl}
              alt={`${profile.name} 프로필 사진`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
          ) : (
            /* placeholder */
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[80px] opacity-[0.04]">⚽</span>
            </div>
          )}

          {/* 아바타 업로드 오버레이 버튼 */}
          {onAvatarUpload && (
            <button
              onClick={() => avatarFileRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 z-[4] flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
              style={{ background: "rgba(0,0,0,0.45)" }}
              aria-label="프로필 사진 변경"
            >
              {avatarUploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
          )}
          {onAvatarUpload && (
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          )}

          {/* 하단 80% cinematic fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[80%]"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(10,10,12,0.6) 40%, rgba(10,10,12,0.92) 70%, #0A0A0C 100%)",
            }}
          />

          {/* 포지션 뱃지 (좌상) */}
          {profile.position && (
            <div
              className="absolute left-4 top-4 z-[3]"
              style={{
                fontFamily: "Oswald, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#D4A853",
                textShadow:
                  "0 0 20px rgba(212,168,83,0.5), 0 2px 4px rgba(0,0,0,0.5)",
                lineHeight: 1,
              }}
            >
              {profile.position}
            </div>
          )}

          {/* 편집 버튼 (우상, onEdit 있을 때) */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="absolute right-4 top-4 z-[3] rounded-full p-2 transition-colors hover:bg-white/10"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
              aria-label="프로필 편집"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}

          {/* 레벨/MVP 뱃지 (우상, onEdit 없을 때) */}
          {!onEdit && (
            <div className="absolute right-4 top-4 z-[3] flex flex-col items-end gap-1">
              {profile.mvpCount != null && profile.mvpCount > 0 && (
                <div
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(212,168,83,0.25)",
                    color: "#D4A853",
                    fontFamily: "Rajdhani, sans-serif",
                    letterSpacing: "0.08em",
                  }}
                >
                  MVP ×{profile.mvpCount}
                </div>
              )}
            </div>
          )}

          {/* onEdit 있을 때도 MVP 뱃지 표시 (편집 버튼과 분리) */}
          {onEdit && profile.mvpCount != null && profile.mvpCount > 0 && (
            <div className="absolute right-4 top-14 z-[3]">
              <div
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(212,168,83,0.25)",
                  color: "#D4A853",
                  fontFamily: "Rajdhani, sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                MVP ×{profile.mvpCount}
              </div>
            </div>
          )}

          {/* 이름/메타/신체정보 (사진 위 오버레이, 하단) */}
          <div className="absolute bottom-0 left-0 right-0 z-[3] px-4 pb-3.5">
            {/* 이름 */}
            <div
              className="text-[26px] font-black leading-none text-[#FAFAFA]"
              style={{
                letterSpacing: "0.04em",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                fontFamily: "Noto Sans KR, sans-serif",
              }}
            >
              {profile.name}
              {profile.isVerified && (
                <span title="인증됨" className="ml-1.5 text-[18px]">
                  ✅
                </span>
              )}
            </div>

            {/* 메타: @handle · 팀 · 출생 */}
            <div
              className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px]"
              style={{ color: "#A1A1AA" }}
            >
              {profile.handle && (
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/p/${profile.handle}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      toast("프로필 링크가 복사되었습니다");
                    } catch {
                      toast("링크 복사에 실패했습니다", "error");
                    }
                  }}
                  className="flex items-center gap-0.5 transition-colors hover:text-[#D4A853]"
                >
                  <span>@{profile.handle}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              )}
              {profile.teamName && (
                <>
                  <span className="opacity-40">·</span>
                  {profile.teamId ? (
                    <Link
                      href={`/team/${profile.teamId}`}
                      className="transition-colors hover:text-[#D4A853]"
                    >
                      {profile.teamName}
                    </Link>
                  ) : (
                    <span>{profile.teamName}</span>
                  )}
                </>
              )}
              {profile.birthYear && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{profile.birthYear}</span>
                </>
              )}
              {profile.city && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{profile.city}</span>
                </>
              )}
            </div>

            {/* 신체정보 pills */}
            {(profile.heightCm || profile.weightKg || preferredFootLabel) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.heightCm && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(4px)",
                      color: "#A1A1AA",
                    }}
                  >
                    {profile.heightCm}cm
                  </span>
                )}
                {profile.weightKg && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(4px)",
                      color: "#A1A1AA",
                    }}
                  >
                    {profile.weightKg}kg
                  </span>
                )}
                {preferredFootLabel && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(4px)",
                      color: "#A1A1AA",
                    }}
                  >
                    {preferredFootLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 골드 디바이더 ── */}
        <div
          className="relative mx-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.1) 8%, rgba(245,215,142,0.35) 50%, rgba(212,168,83,0.1) 92%, transparent 100%)",
          }}
        >
          {/* shimmer */}
          <div
            className="absolute -inset-y-px inset-x-0 z-[1]"
            style={{
              background:
                "linear-gradient(90deg, transparent 30%, rgba(245,215,142,0.15) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 4s ease-in-out infinite",
            }}
          />
          {/* center accent */}
          <div
            className="absolute -top-[1.5px] left-1/2 h-1 w-12 -translate-x-1/2 rounded-sm"
            style={{
              background:
                "linear-gradient(90deg, #8B6914, #D4A853, #F5D78E, #FFF8E1, #F5D78E, #D4A853, #8B6914)",
              boxShadow: "0 0 12px rgba(245,215,142,0.35)",
            }}
          />
        </div>

        {/* ── 스탯 섹션 ── */}
        {hasAnyStats ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <ProfileRadar stats={resolvedRadarStats} />
            <ProfileStatList stats={stats ?? []} />
          </div>
        ) : onAddStat ? (
          <div className="px-4 py-4 text-center">
            <button
              onClick={onAddStat}
              className="w-full rounded-xl py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{
                background: "rgba(212,168,83,0.08)",
                border: "1px solid rgba(212,168,83,0.2)",
                color: "#D4A853",
              }}
            >
              📊 첫 기록을 측정해보세요
            </button>
          </div>
        ) : null}

        {/* ── 프로필 완성도 안내 ── */}
        {missingItems.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={
                missingItems[0].action === "avatar"
                  ? () => avatarFileRef.current?.click()
                  : onEdit
              }
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-[rgba(212,168,83,0.12)]"
              style={{
                borderColor: "rgba(212,168,83,0.2)",
                background: "rgba(212,168,83,0.06)",
              }}
            >
              <span className="text-[13px]">📝</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold" style={{ color: "#D4A853" }}>
                  프로필 완성하기
                </p>
                <p className="mt-0.5 truncate text-[10px]" style={{ color: "#71717A" }}>
                  {missingItems.map((m) => m.label).join(", ")} 등록이 필요해요
                </p>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "rgba(212,168,83,0.5)", flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ProfileCard);
