"use client";

import React from "react";

export type ProfileTabKey = "highlights" | "records" | "career";

interface ProfileTabBarProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
}

const TABS: { key: ProfileTabKey; label: string; icon: string }[] = [
  { key: "highlights", label: "하이라이트", icon: "🎬" },
  { key: "records", label: "기록", icon: "📊" },
  { key: "career", label: "커리어", icon: "⚽" },
];

function ProfileTabBarInner({ activeTab, onTabChange }: ProfileTabBarProps) {
  return (
    <div
      className="sticky z-40 flex border-b border-white/[0.06] bg-bg/95 backdrop-blur-sm"
      style={{ top: 49 }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1 border-b-2 py-[10px] text-xs transition-colors ${
              active
                ? "border-accent text-accent font-bold"
                : "border-transparent text-text-3"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const ProfileTabBar = React.memo(ProfileTabBarInner);
export default ProfileTabBar;
