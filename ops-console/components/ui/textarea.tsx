import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-20 w-full rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface-muted)] px-3 py-2 text-sm text-[var(--ops-ink)] shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-[var(--ops-ink-faint)] focus-visible:border-[var(--ops-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ops-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
