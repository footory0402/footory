interface AlumniLabelProps {
  size?: "sm" | "md";
}

export default function AlumniLabel({ size = "sm" }: AlumniLabelProps) {
  const sizeClasses = size === "sm"
    ? "px-1.5 py-0.5 text-[10px]"
    : "px-2 py-0.5 text-[11px]";

  return (
    <span className={`rounded bg-text-3/15 font-medium text-text-3 ${sizeClasses}`}>
      졸업
    </span>
  );
}
