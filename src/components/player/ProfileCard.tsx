import React, { useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge, PositionBadge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { LEVELS, MVP_TIERS } from "@/lib/constants";
import type { Profile, MvpTier } from "@/lib/types";
import { toast } from "@/components/ui/Toast";

/* ── MVP Badge (inline in profile card) ── */
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
  const lvl = LEVELS[Math.max(1, Math.min(profile.level, 5)) - 1];
  const nextLvl = profile.level < 5 ? LEVELS[profile.level] : null;
  const xpProgress = nextLvl
    ? ((profile.xp - lvl.minXp) / (nextLvl.minXp - lvl.minXp)) * 100
    : 100;

  const levelMissions: Record<number, string> = {
    1: "프로필 사진을 등록하세요",
    2: "첫 영상을 업로드하세요",
    3: "측정 기록을 3개 추가하세요",
    4: "메달을 5개 획득하세요",
  };

  return (
    <div className="animate-fade-up relative overflow-hidden rounded-[10px] bg-card">
      {/* Gold top line */}
      <div className="h-[3px]" style={{ background: "var(--accent-gradient)" }} />

      {/* Gold radial decoration */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-24 w-24 opacity-20"
        style={{
          background: `radial-gradient(circle at 100% 0%, #D4A853 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-4">
        {/* Top: Avatar + Info */}
        <div className="flex gap-3">
          <div className="relative">
            {onAvatarUpload ? (
              <button
                onClick={() => avatarFileRef.current?.click()}
                disabled={avatarUploading}
                className="group relative block"
                aria-label="프로필 사진 변경"
              >
                <Avatar name={profile.name} size="lg" level={profile.level} imageUrl={profile.avatarUrl} />
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
              <Avatar name={profile.name} size="lg" level={profile.level} imageUrl={profile.avatarUrl} />
            )}
            {/* Position badge overlay */}
            {profile.position && (
              <div className="absolute -right-1 -bottom-1">
                <PositionBadge position={profile.position} />
              </div>
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
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[19px] font-bold text-text-1">{profile.name}</span>
              <LevelBadge level={profile.level} />
              {profile.mvpCount > 0 && <MvpBadge count={profile.mvpCount} tier={profile.mvpTier} />}
              {onEdit && (
                <button onClick={onEdit} className="ml-auto shrink-0 rounded-md p-1 text-text-3 transition-colors hover:bg-border hover:text-text-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-[12px] text-text-3">@{profile.handle}</span>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-text-2">
              {profile.position && <span>{profile.position}{profile.subPosition ? ` · ${profile.subPosition}` : ""}</span>}
              {profile.birthYear && age != null && (
                <>{profile.position && <span className="text-text-3">·</span>}<span>{profile.birthYear} (만 {age}세)</span></>
              )}
              {profile.city && (
                <>{(profile.position || profile.birthYear) && <span className="text-text-3">·</span>}<span>{profile.city}</span></>
              )}
              {!profile.position && !profile.birthYear && !profile.city && (
                <span className="text-text-3">프로필을 설정해주세요</span>
              )}
            </div>
            {profile.teamName && (
              <span className="mt-0.5 text-[12px] text-accent">{profile.teamName}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 h-px bg-[var(--divider)]" />

        {/* Bottom: Stats + Level bar */}
        <div className="flex items-center gap-4 text-[12px]">
          <Link href="/profile/follows?tab=followers" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span className="font-stat font-semibold text-text-1">{profile.followers}</span>
            <span className="text-text-3">팔로워</span>
          </Link>
          <Link href="/profile/follows?tab=following" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span className="font-stat font-semibold text-text-1">{profile.following}</span>
            <span className="text-text-3">팔로잉</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="font-stat font-semibold text-text-1">{profile.views}</span>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-text-3">
              {lvl.icon} Lv.{profile.level} {lvl.name}
            </span>
            {nextLvl && (
              <span className="text-text-3">
                {profile.xp}/{nextLvl.minXp} XP
              </span>
            )}
          </div>
          <ProgressBar value={xpProgress} />
          {nextLvl && levelMissions[profile.level] && (
            <p className="mt-1.5 text-[11px] text-text-3">
              다음 레벨: <span className="font-semibold text-accent">{levelMissions[profile.level]}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProfileCard);
