"use client";

import React from "react";

export type ProfileTabKey = "highlights" | "records" | "career";

interface ProfileTabBarProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
}

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "highlights", label: "하이라이트" },
  { key: "records", label: "스탯" },
  { key: "career", label: "커리어" },
];

function ProfileTabBarInner({ activeTab, onTabChange }: ProfileTabBarProps) {
  return (
    <div
      style={{
        margin: "6px 14px 0",
        background: "#111111",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0 8px",
              background: active ? "rgba(255,255,255,0.035)" : "transparent",
              border: "none",
              borderBottom: active ? "2.5px solid #c9a84c" : "2.5px solid transparent",
              color: active ? "#e8d48b" : "rgba(255,255,255,0.24)",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const ProfileTabBar = React.memo(ProfileTabBarInner);
export default ProfileTabBar;
