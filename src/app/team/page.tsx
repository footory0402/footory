"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyTeams } from "@/hooks/useTeam";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import AlumniLabel from "@/components/team/AlumniLabel";
import CreateTeamSheet from "@/components/team/CreateTeamSheet";
import JoinTeamSheet from "@/components/team/JoinTeamSheet";

export default function TeamPage() {
  const { teams, loading, refetch } = useMyTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

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
          <p className="mt-4 text-[17px] font-bold text-text-1">아직 소속 팀이 없어요</p>
          <p className="mt-2 text-[13px] leading-relaxed text-text-3">
            팀을 직접 만들거나, 코치에게 받은<br />초대코드로 팀에 가입해보세요
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              팀 만들기
            </Button>
            <Button variant="secondary" onClick={() => setShowJoin(true)}>
              초대코드 입력
            </Button>
          </div>

          {/* Recommended teams placeholder */}
          <div className="mt-12 w-full">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-text-2">추천 팀</h2>
            </div>
            <div className="flex flex-col items-center rounded-[10px] border border-border/50 bg-card/50 px-4 py-8">
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
            <h1 className="text-[17px] font-bold text-text-1">내 팀</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoin(true)}
                className="rounded-full border border-border px-3 py-1.5 text-[12px] text-text-2 hover:border-accent"
              >
                가입
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg"
              >
                + 만들기
              </button>
            </div>
          </div>

          {/* Current teams */}
          {teams.filter((t) => t.myRole !== "alumni").length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-[13px] font-semibold text-text-2">현재 소속</h2>
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
            <div>
              <h2 className="mb-2 text-[13px] font-semibold text-text-3">이전 소속</h2>
              <div className="space-y-3">
                {teams
                  .filter((t) => t.myRole === "alumni")
                  .map((team) => (
                    <TeamCard key={team.id} team={team} isAlumni />
                  ))}
              </div>
            </div>
          )}
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
      className={`flex items-center gap-3 rounded-[10px] border bg-card p-4 transition-colors hover:border-accent/30 ${
        isAlumni ? "border-border/50 opacity-75" : "border-border"
      }`}
    >
      <Avatar
        name={team.name}
        imageUrl={team.logoUrl}
        size="md"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-text-1">{team.name}</span>
          {team.myRole === "admin" && (
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              관리자
            </span>
          )}
          {isAlumni && <AlumniLabel size="sm" />}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-text-3">
          <span>@{team.handle}</span>
          <span>·</span>
          <span>{team.memberCount}명</span>
          {team.city && (
            <>
              <span>·</span>
              <span>{team.city}</span>
            </>
          )}
        </div>
        {lastActivity && (
          <p className="mt-1 text-[11px] text-text-3">최근 활동: {lastActivity}</p>
        )}
      </div>
      <svg className="h-4 w-4 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
