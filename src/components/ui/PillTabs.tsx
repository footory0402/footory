"use client";

interface PillTabsProps<T extends string> {
  tabs: { key: T; label: string; dot?: boolean }[];
  activeTab: T;
  onChange: (tab: T) => void;
  sticky?: boolean;
}

export default function PillTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  sticky = false,
}: PillTabsProps<T>) {
  return (
    <div
      className={`flex gap-1.5 px-4 py-2 ${
        sticky ? "sticky top-[44px] z-30 glass-nav border-b border-white/5" : ""
      }`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex-1 rounded-full py-2 text-[13px] font-bold transition-all duration-200 ${
            activeTab === tab.key
              ? "bg-accent text-bg shadow-[0_0_12px_rgba(212,168,83,0.2)]"
              : "bg-white/[0.06] text-text-3 active:bg-white/[0.1]"
          }`}
        >
          {tab.label}
          {tab.dot && activeTab !== tab.key && (
            <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-red" />
          )}
        </button>
      ))}
    </div>
  );
}
