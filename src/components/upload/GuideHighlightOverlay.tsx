"use client";

import { useEffect, useRef, useState } from "react";

interface GuideHighlightOverlayProps {
  targetElement: HTMLElement | null;
  title: string;
  description?: string;
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
  }, [title, description]);

  if (!rect) return null;

  const cardWidth =
    viewport.width > 0 ? Math.min(viewport.width < 640 ? 228 : 280, viewport.width - 24) : 228;

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
      <div
        data-testid="upload-guide-highlight"
        className="pointer-events-none absolute rounded-[24px] border border-[#f1d79a]/85"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow:
            "0 0 0 9999px rgba(4,6,10,0.32), 0 0 0 1px rgba(241,215,154,0.72), 0 0 18px rgba(216,179,106,0.16)",
        }}
      />

      <div
        ref={cardRef}
        data-testid="upload-guide-card"
        className="pointer-events-auto absolute rounded-[20px] border border-[#d8b36a]/18 bg-[#12131a]/94 p-3 shadow-[0_14px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
        }}
      >
        <div
          className="absolute h-3 w-3 rotate-45 border-[#d8b36a]/18 bg-[#12131a]/94"
          style={{
            left: arrowLeft,
            ...(actualPlacement === "top"
              ? { bottom: -6, borderRightWidth: 1, borderBottomWidth: 1 }
              : { top: -6, borderLeftWidth: 1, borderTopWidth: 1 }),
          }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold leading-5 text-white">{title}</h2>
            {description ? (
              <p className="mt-1.5 text-[11px] leading-4 text-white/62">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/72"
          >
            닫기
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDisable}
            className="text-[11px] font-semibold text-white/48"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
