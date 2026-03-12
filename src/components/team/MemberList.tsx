"use client";

import Link from "next/link";
import type { TeamMember } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/social/FollowButton";
import AlumniLabel from "@/components/team/AlumniLabel";
import { PositionBadge } from "@/components/ui/Badge";
import type { Position } from "@/lib/constants";

interface MemberListProps {
  members: TeamMember[];
  isAdmin?: boolean;
  currentUserId?: string;
  onRemove?: (profileId: string) => void;
}

export default function MemberList({ members, isAdmin, currentUserId, onRemove }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-text-3">
        아직 멤버가 없어요
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-card"
        >
          <Link
            href={member.profile?.handle ? `/p/${member.profile.handle}` : "#"}
            className="flex flex-1 items-center gap-3"
            aria-disabled={!member.profile?.handle}
            onClick={(e) => {
              if (!member.profile?.handle) e.preventDefault();
            }}
          >
            <Avatar
              name={member.profile?.name ?? "?"}
              imageUrl={member.profile?.avatar_url ?? undefined}
              size="sm"
              
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-text-1">
                  {member.profile?.name ?? "알 수 없음"}
                </span>
                {member.role === "admin" && (
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    관리자
                  </span>
                )}
                {member.role === "alumni" && <AlumniLabel />}
              </div>
              <div className="flex items-center gap-1.5">
                {member.profile?.position && (
                  <PositionBadge position={member.profile.position as Position} size="sm" />
                )}
              </div>
            </div>
          </Link>

          {/* Follow button (not for self) */}
          {currentUserId && currentUserId !== member.profileId && (
            <div className="shrink-0">
              <FollowButton targetId={member.profileId} size="sm" />
            </div>
          )}

          {isAdmin && member.role !== "admin" && onRemove && (
            <button
              onClick={() => onRemove(member.profileId)}
              className="text-[12px] text-text-3 hover:text-red"
            >
              제거
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
