import React from "react";
import Link from "next/link";

interface SocialCardProps {
  followers: number;
  following: number;
  views: number;
  /** 팔로워/팔로잉 클릭 시 이동할 경로 (내 프로필에서만) */
  followsHref?: string;
  className?: string;
}

function SocialCardInner({ followers, following, views, followsHref, className }: SocialCardProps) {
  return (
    <div
      className={`flex items-center rounded-xl bg-card border border-white/[0.04] ${className ?? ""}`}
      style={{ padding: "12px 0" }}
    >
      {followsHref ? (
        <Link
          href={`${followsHref}?tab=followers`}
          className="flex flex-1 flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <span className="font-stat text-[16px] font-medium leading-none text-text-1">{followers}</span>
          <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로워</span>
        </Link>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="font-stat text-[16px] font-medium leading-none text-text-1">{followers}</span>
          <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로워</span>
        </div>
      )}

      <div className="h-6 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      {followsHref ? (
        <Link
          href={`${followsHref}?tab=following`}
          className="flex flex-1 flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <span className="font-stat text-[16px] font-medium leading-none text-text-1">{following}</span>
          <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로잉</span>
        </Link>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="font-stat text-[16px] font-medium leading-none text-text-1">{following}</span>
          <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로잉</span>
        </div>
      )}

      <div className="h-6 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="flex flex-1 flex-col items-center gap-1">
        <span className="font-stat text-[16px] font-medium leading-none text-text-1">{views}</span>
        <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>조회</span>
      </div>
    </div>
  );
}

const SocialCard = React.memo(SocialCardInner);
export default SocialCard;
