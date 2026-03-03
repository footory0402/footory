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
  const declined = diff != null && diff < 0;

  return (
    <div className="animate-slide-r flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[16px]">{icon}</span>
        <span className="text-[13px] text-text-2">{label}</span>
        {verified && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ADE80" className="shrink-0">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
