"use client";

import { useFollow } from "@/hooks/useFollow";
import { usePermissions } from "@/hooks/usePermissions";

interface FollowButtonProps {
  targetId: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
}

export default function FollowButton({ targetId, initialFollowing = false, size = "sm" }: FollowButtonProps) {
  const { canFollow, userId } = usePermissions();
  const { isFollowing, toggle, loading } = useFollow(targetId, initialFollowing);

  if (!canFollow || targetId === userId) return null;

  const sizeClasses = size === "sm"
    ? "px-3 py-1.5 text-xs"
    : "px-4 py-1.5 text-xs";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={isFollowing ? "팔로잉 취소" : "팔로우"}
      className={`rounded-full font-semibold transition-all ${sizeClasses} ${
        isFollowing
          ? "border border-border bg-transparent text-text-2 hover:border-red/50 hover:text-red"
          : "border border-accent/20 bg-accent/10 text-accent hover:bg-accent/15"
      } ${loading ? "opacity-50" : ""}`}
    >
      {isFollowing ? "팔로잉" : "팔로우"}
    </button>
  );
}
