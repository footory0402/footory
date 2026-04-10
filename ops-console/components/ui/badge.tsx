import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--ops-accent)] text-[var(--ops-accent-ink)]",
        secondary: "border-[var(--ops-line)] bg-[var(--ops-surface-muted)] text-[var(--ops-ink)]",
        outline: "border-[var(--ops-line)] text-[var(--ops-ink-muted)]",
        success: "border-transparent bg-[var(--ops-accent-soft)] text-[var(--ops-accent-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
