import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dashed";
  size?: "sm" | "md" | "lg" | "full";
}

const base = "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.97]";

const variants = {
  primary: "bg-gradient-to-r from-accent to-accent-dim text-bg shadow-[0_0_12px_rgba(212,168,83,0.2)]",
  secondary: "bg-card border border-[var(--border-accent)] text-accent",
  ghost: "text-text-2 hover:bg-card",
  dashed: "border border-dashed border-border text-text-3 hover:border-accent hover:text-accent",
};

const sizeMap = {
  sm: "h-8 px-3 text-[12px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-[13px] rounded-[10px] gap-2",
  lg: "h-12 px-6 text-[14px] rounded-xl gap-2",
  full: "h-12 w-full text-[14px] rounded-xl gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
