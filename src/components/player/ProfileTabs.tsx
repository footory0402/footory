"use client";

const TABS = [
  { id: "highlights", label: "영상", icon: "🎬" },
  { id: "records", label: "기록", icon: "📋" },
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
            className={`flex-1 rounded-lg py-2.5 text-center text-[13px] font-bold transition-all duration-200 ${
              isActive
                ? "bg-accent/15 text-accent border border-accent/30"
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
