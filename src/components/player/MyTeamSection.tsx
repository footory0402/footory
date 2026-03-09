"use client";

import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/Card";
import { useMyTeams } from "@/hooks/useTeam";

export default function MyTeamSection() {
  const { teams, loading } = useMyTeams();

  if (loading) {
    return (
      <SectionCard title="소속 팀" icon="⚽">
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </SectionCard>
    );
  }

  const currentTeams = teams.filter((t) => t.myRole === "admin" || t.myRole === "member");
  const alumniTeams = teams.filter((t) => t.myRole === "alumni");

  if (currentTeams.length === 0 && alumniTeams.length === 0) {
    return (
      <SectionCard title="소속 팀" icon="⚽">
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-[12px] text-text-3">아직 소속된 팀이 없습니다</p>
          <Link
            href="/team"
            className="rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-bg transition-opacity active:opacity-80"
          >
            팀에 가입하기
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="소속 팀" icon="⚽">
      <div className="flex flex-col gap-2">
        {/* Team management link */}
        <Link
          href="/team"
          className="mb-1 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] text-text-3 transition-colors active:bg-card-alt"
        >
          <span>팀 관리</span>
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {currentTeams.map((team) => (
          <Link
            key={team.id}
            href={`/team/${team.id}`}
            className="flex items-center gap-3 rounded-lg bg-[var(--bg-elevated)] p-3 transition-colors active:bg-card-alt"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-lg">
              {team.logoUrl ? (
                <Image
                  src={team.logoUrl}
                  alt=""
                  width={28}
                  height={28}
                  sizes="28px"
                  className="h-7 w-7 rounded object-cover"
                />
              ) : (
                "⚽"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-text-1">{team.name}</p>
              <p className="text-[11px] text-text-3">
                {team.city && <span>{team.city} · </span>}
                {team.memberCount}명
              </p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        {alumniTeams.length > 0 && (
          <>
            <p className="mt-1 text-[11px] font-medium text-text-3">이전 소속</p>
            {alumniTeams.map((team) => (
              <Link
                key={team.id}
                href={`/team/${team.id}`}
                className="flex items-center gap-3 rounded-lg p-2.5 text-text-3 transition-colors active:bg-card-alt"
              >
                <span className="text-sm">⚽</span>
                <span className="truncate text-[12px]">{team.name}</span>
                <svg className="ml-auto h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </>
        )}
      </div>
    </SectionCard>
  );
}
