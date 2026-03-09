"use client";

const TABS = [
  { id: "summary", label: "요약", icon: "📋" },
  { id: "skills", label: "스킬", icon: "🏷" },
  { id: "records", label: "기록", icon: "📊" },
] as const;

export type ProfileTab = (typeof TABS)[number]["id"];

interface ProfileTabsProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export default function ProfileTabs({ active, onChange }: ProfileTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-card p-[3px]">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-lg py-2 text-center text-[13px] font-medium transition-all duration-200 ${
              isActive
                ? "bg-[var(--accent-bg)] text-accent"
                : "text-text-3 active:bg-card-alt"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
