import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)] shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-[var(--ops-ink-faint)] focus-visible:border-[var(--ops-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ops-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
