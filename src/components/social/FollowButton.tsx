"use client";

import { useFollow } from "@/hooks/useFollow";

interface FollowButtonProps {
  targetId: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
}

export default function FollowButton({ targetId, initialFollowing = false, size = "sm" }: FollowButtonProps) {
  const { isFollowing, toggle, loading } = useFollow(targetId, initialFollowing);

  const sizeClasses = size === "sm"
    ? "px-3 py-1 text-[12px]"
    : "px-4 py-1.5 text-[13px]";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full font-semibold transition-all ${sizeClasses} ${
        isFollowing
          ? "border border-border bg-transparent text-text-2 hover:border-red/50 hover:text-red"
          : "bg-accent text-bg hover:bg-accent/90"
      } ${loading ? "opacity-50" : ""}`}
    >
      {isFollowing ? "팔로잉" : "팔로우"}
    </button>
  );
}
