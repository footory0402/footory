import React, { useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { PositionBadge } from "@/components/ui/Badge";
import { MVP_TIERS } from "@/lib/constants";
import type { Profile, MvpTier } from "@/lib/types";
import { toast } from "@/components/ui/Toast";

/* ── MVP Badge ── */
function MvpBadge({ count, tier }: { count: number; tier: MvpTier | null }) {
  const tierInfo = tier ? MVP_TIERS.find((t) => t.tier === tier) : MVP_TIERS[0];
  const icon = tierInfo?.icon ?? "🏆";
  const color = tierInfo?.color ?? "#A1A1AA";
  const isHighTier = tier === "allstar" || tier === "legend";

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}33`,
        color,
        boxShadow: isHighTier ? `0 0 8px ${color}33` : undefined,
      }}
    >
      <span>{icon}</span>
      <span className="font-stat">{count}</span>
    </span>
  );
}

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
}

function ProfileCard({ profile, onEdit, onAvatarUpload }: ProfileCardProps) {
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

  const currentYear = new Date().getFullYear();
  const age = profile.birthYear ? currentYear - profile.birthYear : null;

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
    : null;

  return (
    <div className="animate-fade-up relative overflow-hidden rounded-xl bg-card border border-white/[0.06]">
      {/* Gold top accent line */}
      <div className="h-[3px]" style={{ background: "var(--accent-gradient)" }} />

      {/* Subtle gold radial glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-32 w-32 opacity-[0.12]"
        style={{ background: `radial-gradient(circle at 100% 0%, #D4A853 0%, transparent 65%)` }}
      />

      <div className="relative p-4">

        {/* ── Identity row ── */}
        <div className="flex gap-3 items-start">

          {/* Avatar */}
          <div className="relative shrink-0">
            {onAvatarUpload ? (
              <button
                onClick={() => avatarFileRef.current?.click()}
                disabled={avatarUploading}
                className="group relative block"
                aria-label="프로필 사진 변경"
              >
                <Avatar name={profile.name} size="lg" imageUrl={profile.avatarUrl} />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {avatarUploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>
              </button>
            ) : (
              <Avatar name={profile.name} size="lg" imageUrl={profile.avatarUrl} />
            )}
            {onAvatarUpload && (
              <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex min-w-0 flex-1 flex-col">

            {/* Name row */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate text-[21px] font-bold leading-tight text-text-1" style={{ letterSpacing: "-0.4px" }}>
                {profile.name}
              </span>
              {profile.isVerified && (
                <span title="인증된 스카우터" className="shrink-0 text-[15px] leading-none">✅</span>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="ml-auto shrink-0 rounded-md p-1.5 text-text-3 transition-colors hover:bg-white/[0.08] hover:text-text-1"
                  aria-label="프로필 편집"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Achievement badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {profile.position && <PositionBadge position={profile.position} />}
              {profile.mvpCount > 0 && <MvpBadge count={profile.mvpCount} tier={profile.mvpTier} />}
              {(profile.challengeWins ?? 0) > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "#D4A85318", border: "1px solid #D4A85333", color: "#D4A853" }}
                  title={`챌린지 ${profile.challengeWins}회 우승`}
                >
                  🎯<span className="font-stat">{profile.challengeWins}</span>
                </span>
              )}
            </div>

            {/* Handle */}
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
              className="mt-1.5 flex items-center gap-1 w-fit text-[11px] text-text-3 hover:text-accent transition-colors"
            >
              <span>@{profile.handle}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {/* 출생연도 + 도시 */}
            {(profile.birthYear || profile.city) && (
              <p className="mt-0.5 text-[12px] text-text-3">
                {age != null && `만 ${age}세`}
                {age != null && profile.city && <span className="mx-1 opacity-30">·</span>}
                {profile.city}
              </p>
            )}
          </div>
        </div>

        {/* ── 팀: 카드 전체 너비, 독립 행 ── */}
        {profile.teamName && (
          <div className="mt-3">
            {profile.teamId ? (
              <Link
                href={`/team/${profile.teamId}`}
                className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.07] px-3 py-2 transition-colors hover:bg-accent/[0.12]"
              >
                <span className="text-[14px]">⚽</span>
                <span className="text-[13px] font-semibold text-accent">{profile.teamName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-accent/50">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.07] px-3 py-2">
                <span className="text-[14px]">⚽</span>
                <span className="text-[13px] font-semibold text-accent">{profile.teamName}</span>
              </div>
            )}
          </div>
        )}

        {/* ── 신체 칩: 팀 아래, 가장 작게 ── */}
        {(profile.heightCm || profile.weightKg || preferredFootLabel) && (
          <div className="mt-2 flex items-center gap-1.5">
            {profile.heightCm && (
              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] leading-none text-text-3">
                {profile.heightCm}cm
              </span>
            )}
            {profile.weightKg && (
              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] leading-none text-text-3">
                {profile.weightKg}kg
              </span>
            )}
            {preferredFootLabel && (
              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] leading-none text-text-3">
                {preferredFootLabel}
              </span>
            )}
          </div>
        )}

        {/* ── Divider ── */}
        <div className="my-3 h-px bg-white/[0.06]" />

        {/* ── 소셜 스탯: 숫자 크게 ── */}
        <div className="flex items-center">
          <Link
            href="/profile/follows?tab=followers"
            className="flex flex-col items-center gap-0.5 px-3 hover:opacity-70 transition-opacity"
          >
            <span className="font-stat text-[22px] font-bold leading-none text-text-1">{profile.followers}</span>
            <span className="text-[10px] text-text-3">팔로워</span>
          </Link>
          <div className="h-8 w-px bg-white/[0.07]" />
          <Link
            href="/profile/follows?tab=following"
            className="flex flex-col items-center gap-0.5 px-3 hover:opacity-70 transition-opacity"
          >
            <span className="font-stat text-[22px] font-bold leading-none text-text-1">{profile.following}</span>
            <span className="text-[10px] text-text-3">팔로잉</span>
          </Link>
          <div className="ml-auto flex flex-col items-center gap-0.5">
            <span className="font-stat text-[22px] font-bold leading-none text-accent">{profile.views}</span>
            <span className="text-[10px] text-text-3">조회</span>
          </div>
        </div>

        {/* ── 프로필 완성도 안내 ── */}
        {missingItems.length > 0 && (
          <button
            onClick={missingItems[0].action === "avatar" ? () => avatarFileRef.current?.click() : onEdit}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.06] px-3 py-2 text-left transition-colors hover:bg-accent/[0.12]"
          >
            <span className="text-[13px]">📝</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-accent">프로필 완성하기</p>
              <p className="mt-0.5 text-[10px] text-text-3 truncate">
                {missingItems.map((m) => m.label).join(", ")} 등록이 필요해요
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent/50">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

      </div>
    </div>
  );
}

export default React.memo(ProfileCard);
