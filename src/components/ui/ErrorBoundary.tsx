"use client";

import React from "react";

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1e]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A853"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-text-1">
            오류가 발생했습니다
          </p>
          <p className="mt-1 text-[13px] text-text-3">
            잠시 후 다시 시도해주세요
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-bg"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
