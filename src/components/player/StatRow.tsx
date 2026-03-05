interface StatRowProps {
  icon: string;
  label: string;
  value: number;
  unit: string;
  previousValue?: number;
  verified?: boolean;
}

export default function StatRow({ icon, label, value, unit, previousValue, verified }: StatRowProps) {
  const diff = previousValue != null ? value - previousValue : null;
  const improved = diff != null && diff > 0;

  return (
    <div className="animate-slide-r flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[16px]">{icon}</span>
        <span className="text-[13px] text-text-2">{label}</span>
        {verified && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-green)" className="shrink-0">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-stat text-[18px] font-semibold text-text-1">
          {value}
          <span className="text-[12px] text-text-3"> {unit}</span>
        </span>
        {diff != null && diff !== 0 && (
          <span className={`text-[11px] font-semibold ${improved ? "text-green" : "text-red"}`}>
            {improved ? "↑" : "↓"}{Math.abs(diff).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
