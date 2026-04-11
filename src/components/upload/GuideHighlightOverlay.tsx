"use client";

import { useEffect, useRef, useState } from "react";

interface GuideHighlightOverlayProps {
  targetElement: HTMLElement | null;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  onSkip: () => void;
  onDisable: () => void;
  placement?: "top" | "bottom";
  align?: "start" | "center" | "end";
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function GuideHighlightOverlay({
  targetElement,
  title,
  description,
  primaryLabel,
  onPrimary,
  onSkip,
  onDisable,
  placement = "bottom",
  align = "center",
}: GuideHighlightOverlayProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateRect = () => {
      const target = targetElement;
      if (!target) {
        setRect(null);
        return;
      }

      const nextRect = target.getBoundingClientRect();
      setRect({
        top: Math.max(12, nextRect.top - 6),
        left: Math.max(12, nextRect.left - 6),
        width: Math.max(40, nextRect.width + 12),
        height: Math.max(40, nextRect.height + 12),
      });
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [targetElement]);

  useEffect(() => {
    if (!cardRef.current) return;

    const updateCardHeight = () => {
      setCardHeight(cardRef.current?.offsetHeight ?? 0);
    };

    updateCardHeight();
    const observer = new ResizeObserver(updateCardHeight);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [title, description, primaryLabel]);

  if (!rect) return null;

  const cardWidth =
    viewport.width > 0 ? Math.min(viewport.width < 640 ? 252 : 320, viewport.width - 24) : 252;

  const preferredLeft =
    align === "start"
      ? rect.left
      : align === "end"
        ? rect.left + rect.width - cardWidth
        : rect.left + rect.width / 2 - cardWidth / 2;
  const cardLeft =
    viewport.width > 0
      ? Math.min(Math.max(12, preferredLeft), viewport.width - cardWidth - 12)
      : 12;

  const gap = 12;
  const spaceAbove = rect.top - 12;
  const reservedBottom = viewport.width > 0 && viewport.width < 640 ? 112 : 24;
  const spaceBelow = viewport.height - rect.top - rect.height - reservedBottom;

  const actualPlacement =
    viewport.height <= 0 || cardHeight <= 0
      ? placement
      : placement === "bottom" && spaceBelow < cardHeight + gap && spaceAbove > spaceBelow
        ? "top"
        : placement === "top" && spaceAbove < cardHeight + gap && spaceBelow > spaceAbove
          ? "bottom"
          : placement;

  const cardTop =
    actualPlacement === "top"
      ? Math.max(12, rect.top - cardHeight - gap)
      : Math.min(
          rect.top + rect.height + gap,
          Math.max(12, viewport.height - cardHeight - reservedBottom)
        );

  const arrowLeft = Math.min(Math.max(18, rect.left + rect.width / 2 - cardLeft), cardWidth - 18);

  return (
    <div className="pointer-events-none fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-[rgba(4,6,10,0.58)]" />
      <div
        data-testid="upload-guide-highlight"
        className="pointer-events-none absolute rounded-[28px] border border-[#f1d79a] shadow-[0_0_0_9999px_rgba(4,6,10,0.58)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow:
            "0 0 0 9999px rgba(4,6,10,0.58), 0 0 0 1px rgba(241,215,154,0.72), 0 0 22px rgba(216,179,106,0.2)",
        }}
      />

      <div
        ref={cardRef}
        data-testid="upload-guide-card"
        className="pointer-events-auto absolute rounded-[24px] border border-[#d8b36a]/22 bg-[#12131a]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
        }}
      >
        <div
          className="absolute h-3 w-3 rotate-45 border-[#d8b36a]/22 bg-[#12131a]/96"
          style={{
            left: arrowLeft,
            ...(actualPlacement === "top"
              ? { bottom: -6, borderRightWidth: 1, borderBottomWidth: 1 }
              : { top: -6, borderLeftWidth: 1, borderTopWidth: 1 }),
          }}
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8b36a]">
              빠른 안내
            </p>
            <h2 className="mt-2 text-[15px] font-bold text-white">{title}</h2>
            <p className="mt-2 text-[12px] leading-5 text-white/70">{description}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/72"
          >
            건너뛰기
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDisable}
            className="text-[12px] font-semibold text-white/48"
          >
            다시 보지 않기
          </button>
          {primaryLabel && onPrimary ? (
            <button
              type="button"
              onClick={onPrimary}
              className="rounded-full bg-[#d8b36a] px-4 py-2 text-[12px] font-bold text-[#09090b]"
            >
              {primaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
