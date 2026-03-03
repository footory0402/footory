interface MedalBadgeProps {
  label: string;
  value: number;
  unit: string;
  verified?: boolean;
  size?: "sm" | "md";
}

export default function MedalBadge({ label, value, unit, verified, size = "sm" }: MedalBadgeProps) {
  const isSmall = size === "sm";

  return (
    <div
      className={`animate-pop-in inline-flex flex-col items-center gap-1 rounded-[10px] border border-[var(--border-accent)] bg-[var(--accent-bg)] ${
        isSmall ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <span className={`${isSmall ? "text-[20px]" : "text-[28px]"}`}>🏅</span>
      <span className={`font-stat font-bold text-accent ${isSmall ? "text-[14px]" : "text-[18px]"}`}>
        {value}{unit}
      </span>
      <span className={`text-text-2 ${isSmall ? "text-[10px]" : "text-[11px]"}`}>
        {label}
      </span>
      {verified && (
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-green">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          인증됨
        </span>
      )}
    </div>
  );
}
