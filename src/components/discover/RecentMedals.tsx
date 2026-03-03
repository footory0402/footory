"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

interface RecentMedalsProps {
  medals: any[];
  loading: boolean;
}

export default function RecentMedals({ medals, loading }: RecentMedalsProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 w-32 shrink-0 animate-pulse rounded-[12px] bg-card" />
        ))}
      </div>
    );
  }

  if (medals.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[12px] bg-card py-6">
        <p className="text-[13px] text-text-3">아직 메달이 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {medals.map((m: any) => {
        const profile = m.profiles;
        return (
          <Link
            key={m.id}
            href={profile ? `/p/${profile.handle}` : "#"}
            className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-[12px] bg-card p-3"
          >
            <span className="text-[24px]">{m.icon ?? "🏅"}</span>
            <span className="text-[11px] font-semibold text-accent text-center line-clamp-1">
              {m.label ?? m.stat_type}
            </span>
            {profile && (
              <div className="flex items-center gap-1.5">
                <Avatar name={profile.name} size="xs" level={profile.level} imageUrl={profile.avatar_url ?? undefined} />
                <span className="text-[11px] text-text-2 truncate max-w-[60px]">{profile.name}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
