"use client";

import { useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "./FollowButton";
import { useFollowList, type FollowUser } from "@/hooks/useFollow";
import type { Position } from "@/lib/constants";
import { POSITION_COLORS } from "@/lib/constants";

interface FollowListProps {
  type: "followers" | "following";
  profileId?: string;
  currentUserId?: string;
}

function UserRow({ user, currentUserId }: { user: FollowUser; currentUserId?: string }) {
  const posColor = POSITION_COLORS[user.position as Position] ?? "#A1A1AA";

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar
        name={user.name}
        size="sm"
        
        imageUrl={user.avatar_url ?? undefined}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-text-1 truncate">{user.name}</span>
          <span className="text-[10px]" style={{ color: posColor }}>{user.position}</span>
        </div>
        <span className="text-[12px] text-text-3">@{user.handle}</span>
      </div>
      {currentUserId && currentUserId !== user.id && (
        <FollowButton targetId={user.id} size="sm" />
      )}
    </div>
  );
}

export default function FollowList({ type, profileId, currentUserId }: FollowListProps) {
  const { items, loading, fetchList } = useFollowList();

  useEffect(() => {
    fetchList(type, profileId);
  }, [type, profileId, fetchList]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center py-12 text-[13px] text-text-3">
        {type === "followers" ? "아직 팔로워가 없어요" : "아직 팔로잉하는 선수가 없어요"}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((user) => (
        <UserRow key={user.id} user={user} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
