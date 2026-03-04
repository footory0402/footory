"use client";

import { useState, useEffect, use } from "react";
import { useTeamDetail, useTeamActions } from "@/hooks/useTeam";
import TeamHeader from "@/components/team/TeamHeader";
import MemberList from "@/components/team/MemberList";
import TeamAlbum from "@/components/team/TeamAlbum";
import ImportToProfileSheet from "@/components/team/ImportToProfileSheet";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TABS = ["멤버", "앨범"] as const;

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { team, members, albums, loading, refetch } = useTeamDetail(id);
  const { removeMember, leaveTeam } = useTeamActions();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("멤버");
  const [showImport, setShowImport] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [ranking, setRanking] = useState<{ activity_score?: number; rank?: number; mvp_count?: number }>({});

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

  if (loading || !team) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const isAdmin = team.myRole === "admin";
  const isAlumni = team.myRole === "alumni";
  const isActiveMember = team.myRole === "admin" || team.myRole === "member";

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

  return (
    <div className="pb-24">
      <TeamHeader
        team={team}
        activityScore={ranking.activity_score}
        rank={ranking.rank}
        mvpCount={ranking.mvp_count}
      />

      {/* Alumni notice */}
      {isAlumni && (
        <div className="mx-4 mb-3 rounded-[10px] bg-card-alt px-4 py-2.5 text-[12px] text-text-3">
          졸업한 팀입니다. 앨범 열람과 내 영상 가져오기만 가능합니다.
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
        {/* Settings — admin only (hidden for alumni) */}
        {isAdmin && (
          <Link
            href={`/team/${id}/settings`}
            className="flex-1 rounded-[10px] border border-border bg-card py-2 text-center text-[13px] text-text-2 hover:border-accent"
          >
            설정
          </Link>
        )}
        {/* Import — available for all members including alumni (own content only) */}
        {activeTab === "앨범" && team.myRole && (
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 rounded-[10px] border border-accent bg-card py-2 text-[13px] text-accent"
          >
            가져오기
          </button>
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
            {tab === "앨범" && (
              <span className="ml-1 text-[11px]">{albums.length}</span>
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
        {activeTab === "앨범" && <TeamAlbum albums={albums} />}
      </div>

      <ImportToProfileSheet
        open={showImport}
        onClose={() => setShowImport(false)}
        albums={albums}
      />
    </div>
  );
}
