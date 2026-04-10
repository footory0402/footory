import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ops-bg)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ops-accent)] text-[var(--ops-accent-ink)] shadow-[var(--ops-shadow-soft)] hover:bg-[var(--ops-accent-strong)]",
        secondary:
          "border border-[var(--ops-line)] bg-[var(--ops-surface)] text-[var(--ops-ink)] hover:bg-[var(--ops-surface-muted)]",
        ghost: "text-[var(--ops-ink-muted)] hover:bg-[var(--ops-surface-muted)] hover:text-[var(--ops-ink)]",
        destructive: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
        outline:
          "border border-[var(--ops-line)] bg-transparent text-[var(--ops-ink)] hover:bg-[var(--ops-surface-muted)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
