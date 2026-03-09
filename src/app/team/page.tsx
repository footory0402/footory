"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyTeams } from "@/hooks/useTeam";
import { usePermissions } from "@/hooks/usePermissions";
import Avatar from "@/components/ui/Avatar";
import AlumniLabel from "@/components/team/AlumniLabel";
import CreateTeamSheet from "@/components/team/CreateTeamSheet";
import JoinTeamSheet from "@/components/team/JoinTeamSheet";

export default function TeamPage() {
  const { teams, loading, refetch } = useMyTeams();
  const { role, loading: roleLoading } = usePermissions();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Scout sees watchlist-focused team view (only after role is confirmed)
  if (!roleLoading && role === "scout") {
    return (
      <div className="px-4 pb-24 pt-4">
        <div className="flex flex-col items-center pt-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-4xl mb-4">🔭</div>
          <p className="text-lg font-bold text-text-1">관심 팀 목록</p>
          <p className="mt-2 text-sm text-text-3 leading-relaxed">
            스카우터에게는 팀 소속 기능 대신<br />관심 선수·팀 탐색이 제공됩니다
          </p>
          <div className="mt-6 flex flex-col gap-3 w-full max-w-[280px]">
            <Link
              href="/discover?tab=team"
              className="rounded-full bg-accent py-3 text-sm font-semibold text-bg text-center"
            >
              팀 탐색하기
            </Link>
            <Link
              href="/profile/watchlist"
              className="rounded-full border border-accent/30 py-3 text-sm font-medium text-accent text-center"
            >
              관심 선수 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4">
      {teams.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center pt-12">
          {/* Illustration area */}
          <div className="relative mb-2 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent/5" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-card">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-xl font-bold text-text-1">아직 소속 팀이 없어요</p>
          <p className="mt-2 text-sm leading-relaxed text-text-3">
            팀을 직접 만들거나, 코치에게 받은<br />초대코드로 팀에 가입해보세요
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg"
            >
              팀 만들기
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-2 transition-colors hover:border-accent hover:text-accent"
            >
              초대코드 입력
            </button>
          </div>

          {/* Recommended teams placeholder */}
          <div className="mt-12 w-full">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-2">추천 팀</h2>
            </div>
            <div className="card-elevated flex flex-col items-center px-4 py-8 opacity-60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3/60">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p className="mt-2 text-[13px] text-text-3">주변 팀이 준비 중이에요</p>
            </div>
          </div>
        </div>
      ) : (
        /* Team list — current / previous separation */
        <>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-text-1">내 팀</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoin(true)}
                className="rounded-full border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent/10"
              >
                가입
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
              >
                + 만들기
              </button>
            </div>
          </div>

          {/* Current teams */}
          {teams.filter((t) => t.myRole !== "alumni").length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-base font-semibold text-text-2">현재 소속</h2>
              <div className="space-y-3">
                {teams
                  .filter((t) => t.myRole !== "alumni")
                  .map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
              </div>
            </div>
          )}

          {/* Previous teams (alumni) */}
          {teams.filter((t) => t.myRole === "alumni").length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-base font-semibold text-text-3">이전 소속</h2>
              <div className="space-y-3">
                {teams
                  .filter((t) => t.myRole === "alumni")
                  .map((team) => (
                    <TeamCard key={team.id} team={team} isAlumni />
                  ))}
              </div>
            </div>
          )}

          {/* Placeholder sections */}
          <div className="space-y-4 mt-2">
            <PlaceholderSection title="팀 활동" icon="📢" />
            <PlaceholderSection title="최근 경기" icon="⚽" />
            <PlaceholderSection title="팀 통계" icon="📊" />
          </div>
        </>
      )}

      <CreateTeamSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
      <JoinTeamSheet open={showJoin} onClose={() => setShowJoin(false)} onJoined={refetch} />
    </div>
  );
}

function TeamCard({
  team,
  isAlumni,
  lastActivity,
}: {
  team: ReturnType<typeof useMyTeams>["teams"][number];
  isAlumni?: boolean;
  lastActivity?: string;
}) {
  return (
    <Link
      href={`/team/${team.id}`}
      className={`card-elevated flex items-center gap-3 p-4 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${
        isAlumni ? "opacity-70" : ""
      }`}
    >
      <Avatar
        name={team.name}
        imageUrl={team.logoUrl}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-1 truncate">{team.name}</span>
          {team.myRole === "admin" && (
            <span className="shrink-0 rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              관리자
            </span>
          )}
          {isAlumni && <AlumniLabel size="sm" />}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-3">
          <span>@{team.handle}</span>
          <span>·</span>
          <span className="font-stat font-bold text-text-2">{team.memberCount}</span>
          <span>명</span>
          {team.city && (
            <>
              <span>·</span>
              <span>{team.city}</span>
            </>
          )}
        </div>
        {lastActivity && (
          <p className="mt-1 text-xs text-text-3">최근 활동: {lastActivity}</p>
        )}
      </div>
      <svg className="h-4 w-4 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function PlaceholderSection({ title, icon }: { title: string; icon: string }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-text-2">
        <span className="mr-1.5">{icon}</span>{title}
      </h2>
      <div className="card-elevated flex flex-col items-center px-4 py-6 opacity-50">
        <p className="text-xs text-text-3">준비 중이에요</p>
      </div>
    </div>
  );
}
