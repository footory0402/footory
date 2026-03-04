interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export default function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-card-alt ${className}`}
    >
      <div
        className="animate-grow-w h-full rounded-full shadow-[0_0_8px_rgba(212,168,83,0.3)]"
        style={{
          width: `${clamped}%`,
          background: "var(--accent-gradient)",
        }}
      />
    </div>
  );
}
