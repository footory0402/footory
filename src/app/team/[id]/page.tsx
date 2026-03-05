"use client";

import { useState, useEffect, use } from "react";
import { useTeamDetail, useTeamActions } from "@/hooks/useTeam";
import TeamHeader from "@/components/team/TeamHeader";
import MemberList from "@/components/team/MemberList";
import TeamFeed from "@/components/team/TeamFeed";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TABS = ["멤버", "피드"] as const;

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { team, members, loading, refetch } = useTeamDetail(id);
  const { removeMember, leaveTeam } = useTeamActions();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("멤버");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [ranking, setRanking] = useState<{ activity_score?: number; rank?: number; mvp_count?: number }>({});
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? undefined));
  }, []);

  // Fetch team ranking data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/teams/${id}?includeRanking=true`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.ranking) setRanking(d.ranking);
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="text-[15px] font-semibold text-text-1">팀을 찾을 수 없습니다</p>
        <p className="mt-1 text-[13px] text-text-3">존재하지 않거나 접근 권한이 없습니다</p>
        <Link
          href="/team"
          className="mt-4 inline-flex rounded-[10px] border border-border px-4 py-2 text-[13px] text-text-2"
        >
          팀 목록으로
        </Link>
      </div>
    );
  }

  const isAdmin = team.myRole === "admin";
  const isAlumni = team.myRole === "alumni";

  const handleRemove = async (profileId: string) => {
    if (!confirm("이 멤버를 제거하시겠습니까?")) return;
    await removeMember(team.id, profileId);
    refetch();
  };

  const handleLeave = async () => {
    if (!confirm("팀에서 탈퇴하시겠습니까?")) return;
    await leaveTeam(team.id);
    window.location.href = "/team";
  };

  const handleCopyCode = async () => {
    if (!team.inviteCode) return;
    try {
      await navigator.clipboard.writeText(team.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = team.inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleShareCode = () => {
    if (!team.inviteCode) return;
    const text = `${team.name}에 참여하세요! 코드: ${team.inviteCode}\nFootory에서 입력하세요`;
    if (navigator.share) {
      navigator.share({ title: team.name, text }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="pb-24">
      {/* Back button */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <button
          onClick={() => window.history.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-[15px] font-semibold text-text-1">{team.name}</h2>
      </div>

      <TeamHeader
        team={team}
        activityScore={ranking.activity_score}
        rank={ranking.rank}
        mvpCount={ranking.mvp_count}
      />

      {/* Alumni notice */}
      {isAlumni && (
        <div className="mx-4 mb-3 rounded-[10px] bg-card-alt px-4 py-2.5 text-[12px] text-text-3">
          졸업한 팀입니다. 팀 피드 열람만 가능합니다.
        </div>
      )}

      {/* Invite code */}
      {team.inviteCode && (
        <div className="mx-4 mb-4 flex items-center justify-between rounded-[10px] border border-border bg-card px-4 py-3">
          <div>
            <p className="text-[11px] text-text-3">팀 코드</p>
            <p className="mt-0.5 font-stat text-[16px] font-bold tracking-wider text-text-1">
              {team.inviteCode}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-2 transition-colors active:bg-card-alt"
            >
              {codeCopied ? "복사됨!" : "복사"}
            </button>
            <button
              onClick={handleShareCode}
              className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-bg transition-colors active:bg-accent/80"
            >
              공유
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        {team.myRole && (
          <button
            onClick={handleLeave}
            className="flex-1 rounded-[10px] border border-border bg-card py-2 text-[13px] text-text-2 hover:border-red hover:text-red"
          >
            탈퇴
          </button>
        )}
        {isAdmin && (
          <Link
            href={`/team/${id}/settings`}
            className="flex-1 rounded-[10px] border border-border bg-card py-2 text-center text-[13px] text-text-2 hover:border-accent"
          >
            설정
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-center text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? "border-b-2 border-accent text-accent"
                : "text-text-3"
            }`}
          >
            {tab}
            {tab === "멤버" && (
              <span className="ml-1 text-[11px]">{members.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-3">
        {activeTab === "멤버" && (
          <MemberList
            members={members}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            onRemove={handleRemove}
          />
        )}
        {activeTab === "피드" && <TeamFeed teamId={id} />}
      </div>
    </div>
  );
}
