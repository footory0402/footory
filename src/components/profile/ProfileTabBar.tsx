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
      className="sticky z-40 flex"
      style={{
        top: 49,
        background: "rgba(8,8,8,0.96)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--v5-card-border)",
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-1 items-center justify-center gap-1"
            style={{
              padding: "11px 0 9px",
              background: "transparent",
              border: "none",
              borderBottom: active
                ? "2px solid var(--v5-gold)"
                : "2px solid transparent",
              color: active
                ? "var(--v5-gold-light)"
                : "var(--v5-text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            <span style={{ fontSize: 12 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const ProfileTabBar = React.memo(ProfileTabBarInner);
export default ProfileTabBar;
