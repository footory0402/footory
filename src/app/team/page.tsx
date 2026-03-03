"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyTeams } from "@/hooks/useTeam";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
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
        <div className="flex flex-col items-center justify-center pt-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-3xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] font-semibold text-text-1">아직 팀이 없어요</p>
          <p className="mt-1 text-[13px] text-text-3">팀을 만들거나 초대코드로 가입하세요</p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              팀 만들기
            </Button>
            <Button variant="secondary" onClick={() => setShowJoin(true)}>
              초대코드 입력
            </Button>
          </div>
        </div>
      ) : (
        /* Team list */
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

          <div className="space-y-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/team/${team.id}`}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4 transition-colors hover:border-accent/30"
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
                </div>
                <svg className="h-4 w-4 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </>
      )}

      <CreateTeamSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
      <JoinTeamSheet open={showJoin} onClose={() => setShowJoin(false)} onJoined={refetch} />
    </div>
  );
}
