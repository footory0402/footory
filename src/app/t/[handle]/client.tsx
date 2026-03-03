"use client";

import { useState } from "react";
import TeamHeader from "@/components/team/TeamHeader";
import MemberList from "@/components/team/MemberList";
import TeamAlbum from "@/components/team/TeamAlbum";
import ShareSheet from "@/components/ui/ShareSheet";
import type { Team, TeamMember, TeamAlbumItem } from "@/lib/types";

interface PublicTeamData {
  [key: string]: unknown;
  id: string;
  handle: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  city?: string | null;
  founded_year?: number | null;
  memberCount: number;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  members: Record<string, unknown>[];
  albums: Record<string, unknown>[];
}

const TABS = ["멤버", "앨범"] as const;

function toTeam(data: PublicTeamData): Team {
  return {
    id: data.id,
    handle: data.handle,
    name: data.name,
    logoUrl: data.logo_url ?? undefined,
    description: data.description ?? undefined,
    city: data.city ?? undefined,
    foundedYear: data.founded_year ?? undefined,
    memberCount: data.memberCount,
    inviteCode: data.invite_code,
    createdBy: data.created_by ?? "",
    createdAt: data.created_at,
  };
}

function mapMembers(rows: Record<string, unknown>[]): TeamMember[] {
  return rows.map((r) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    profileId: r.profile_id as string,
    role: r.role as "admin" | "member",
    joinedAt: r.joined_at as string,
    profile: r.profiles as TeamMember["profile"],
  }));
}

function mapAlbums(rows: Record<string, unknown>[]): TeamAlbumItem[] {
  return rows.map((r) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    uploadedBy: r.uploaded_by as string | null,
    mediaType: r.media_type as "photo" | "video",
    mediaUrl: r.media_url as string,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    createdAt: r.created_at as string,
  }));
}

export default function PublicTeamClient({ team: data }: { team: PublicTeamData }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("멤버");
  const [shareOpen, setShareOpen] = useState(false);

  const team = toTeam(data);
  const members = mapMembers(data.members);
  const albums = mapAlbums(data.albums);

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://footory.app/t/${team.handle}`;

  return (
    <div className="mx-auto max-w-[430px] pb-24">
      <TeamHeader team={team} />

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => setShareOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-border py-2 text-[13px] font-semibold text-text-2 transition-colors hover:border-accent hover:text-accent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
          공유
        </button>
        <a
          href="/login"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-accent py-2 text-[13px] font-semibold text-black transition-colors hover:bg-accent/90"
        >
          가입하기
        </a>
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
            {tab === "멤버" && <span className="ml-1 text-[11px]">{members.length}</span>}
            {tab === "앨범" && <span className="ml-1 text-[11px]">{albums.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-3">
        {activeTab === "멤버" && <MemberList members={members} />}
        {activeTab === "앨범" && <TeamAlbum albums={albums} />}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={`${team.name} — Footory`}
        text={`${team.name} | ${team.memberCount}명의 멤버 | Footory 팀`}
      />
    </div>
  );
}
