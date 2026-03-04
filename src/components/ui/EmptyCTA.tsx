interface EmptyCTAProps {
  text: string;
  onAction?: () => void;
}

export default function EmptyCTA({ text, onAction }: EmptyCTAProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-[var(--accent-bg)] py-6">
      <span className="text-[12px] text-text-3">{text}</span>
      <button
        onClick={onAction}
        className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-bg"
        style={{ background: "var(--accent-gradient)" }}
      >
        추가하기
      </button>
    </div>
  );
}
