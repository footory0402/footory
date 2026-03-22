"use client";

import React from "react";

export type ProfileTabKey = "highlights" | "records" | "career";

interface ProfileTabBarProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
  stickyTop?: number;
}

const TABS: { key: ProfileTabKey; label: string; icon: string }[] = [
  { key: "highlights", label: "하이라이트", icon: "🎬" },
  { key: "records", label: "기록", icon: "📊" },
  { key: "career", label: "커리어", icon: "⚽" },
];

function ProfileTabBarInner({ activeTab, onTabChange, stickyTop }: ProfileTabBarProps) {
  return (
    <div
      className="sticky z-40 bg-bg/95 backdrop-blur-sm px-4 py-2"
      style={{ top: stickyTop ?? 49 }}
    >
      <div className="flex rounded-xl bg-card p-1 gap-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs transition-all ${
                active
                  ? "bg-elevated text-accent font-bold"
                  : "text-text-3"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ProfileTabBar = React.memo(ProfileTabBarInner);
export default ProfileTabBar;
