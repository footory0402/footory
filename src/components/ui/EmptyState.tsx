"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({
  icon,
  message,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-up">
      <div className="mb-4 text-text-3 [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </div>
      <p className="text-base font-medium text-text-2">{message}</p>
      {description && (
        <p className="mt-1.5 text-sm text-text-3 max-w-[260px]">{description}</p>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-5 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-bg transition-opacity active:opacity-80"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
