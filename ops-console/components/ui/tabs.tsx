import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-auto w-full items-center gap-1 rounded-2xl border border-[var(--ops-line)] bg-[var(--ops-surface)] p-1 shadow-[var(--ops-shadow-soft)]",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-[var(--ops-ink-muted)] transition-all outline-none data-[state=active]:bg-[var(--ops-accent-soft)] data-[state=active]:text-[var(--ops-ink)] data-[state=active]:shadow-[0_0_0_1px_rgba(78,203,141,0.28)] focus-visible:ring-2 focus-visible:ring-[var(--ops-ring)]",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
