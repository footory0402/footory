import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge, PositionBadge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { LEVELS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
}

export default function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - profile.birthYear;
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
            <Avatar name={profile.name} size="lg" level={profile.level} imageUrl={profile.avatarUrl} />
            {/* Position badge overlay */}
            <div className="absolute -right-1 -bottom-1">
              <PositionBadge position={profile.position} />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[19px] font-bold text-text-1">{profile.name}</span>
              <LevelBadge level={profile.level} />
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
              <span>{profile.position}{profile.subPosition ? ` · ${profile.subPosition}` : ""}</span>
              <span className="text-text-3">·</span>
              <span>{profile.birthYear} (만 {age}세)</span>
              <span className="text-text-3">·</span>
              <span>{profile.city}</span>
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
