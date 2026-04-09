"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PinchZoomVideo from "@/components/editor/video/PinchZoomVideo";
import { toast } from "@/components/ui/Toast";
import { FOCUS_ZOOM_PRESETS, resolveFocusZoom } from "@/lib/focus-zoom";
import {
  type TrackingMode,
  type TrackingPoint,
  resolvePlaybackSpotlight,
  sanitizeTrackingPoints,
} from "@/lib/playback-focus";
import { useUploadStore } from "@/stores/upload-store";

interface DecorateViewProps {
  videoSrc: string;
  onUpload: () => void;
  onBack: () => void;
}

type FollowSlot = "start" | "middle" | "end";

interface FollowAnchor {
  slot: FollowSlot;
  label: string;
  time: number;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function getFollowAnchors(trimStart: number, trimEnd: number) {
  const middle = trimStart + (trimEnd - trimStart) / 2;
  return [
    { slot: "start", label: "시작", time: trimStart },
    { slot: "middle", label: "중간", time: middle },
    { slot: "end", label: "끝", time: trimEnd },
  ] satisfies FollowAnchor[];
}

function getPointForSlot(
  slot: FollowSlot,
  anchors: FollowAnchor[],
  points: TrackingPoint[],
) {
  const anchor = anchors.find((item) => item.slot === slot);
  if (!anchor) return null;

  return points.find((point) => Math.abs(point.time - anchor.time) < 0.05) ?? null;
}

export default function DecorateView({ videoSrc, onUpload, onBack }: DecorateViewProps) {
  const spotlightX = useUploadStore((state) => state.spotlightX);
  const spotlightY = useUploadStore((state) => state.spotlightY);
  const freezeAt = useUploadStore((state) => state.freezeAt);
  const trimStart = useUploadStore((state) => state.trimStart);
  const trimEnd = useUploadStore((state) => state.trimEnd);
  const duration = useUploadStore((state) => state.duration) ?? 0;
  const trackingMode = useUploadStore((state) => state.trackingMode);
  const trackingPoints = useUploadStore((state) => state.trackingPoints);
  const effects = useUploadStore((state) => state.effects);
  const status = useUploadStore((state) => state.status);

  const effectiveTrimEnd = trimEnd ?? duration;
  const anchors = useMemo(
    () => getFollowAnchors(trimStart, effectiveTrimEnd),
    [effectiveTrimEnd, trimStart],
  );
  const sanitizedPoints = useMemo(
    () => sanitizeTrackingPoints(trackingPoints),
    [trackingPoints],
  );
  const [previewTime, setPreviewTime] = useState(freezeAt ?? trimStart);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FollowSlot>("start");
  const [isReady, setIsReady] = useState(false);

  const fixedSpotlight = spotlightX != null && spotlightY != null
    ? { x: spotlightX, y: spotlightY }
    : null;

  const previewSpotlight = useMemo(
    () => {
      if (trackingMode === "follow") {
        const selectedPoint = getPointForSlot(selectedSlot, anchors, sanitizedPoints);
        if (selectedPoint && Math.abs(selectedPoint.time - previewTime) < 0.5) {
          return { x: selectedPoint.x, y: selectedPoint.y };
        }
      }

      return resolvePlaybackSpotlight({
        spotlight: fixedSpotlight,
        trackingMode,
        trackingPoints: sanitizedPoints,
        time: previewTime,
      });
    },
    [anchors, fixedSpotlight, previewTime, sanitizedPoints, selectedSlot, trackingMode],
  );

  useEffect(() => {
    if (freezeAt == null) return;
    setPreviewTime(freezeAt);
  }, [freezeAt]);

  useEffect(() => {
    const defaultSlot = anchors.find((anchor) =>
      Math.abs(anchor.time - previewTime) < 0.4
    )?.slot;
    if (defaultSlot) {
      setSelectedSlot(defaultSlot);
    }
  }, [anchors, previewTime]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const selectedFocusZoom = resolveFocusZoom(effects.focusZoom);
  const hasFixedSpotlight = fixedSpotlight != null;
  const followReady = anchors.every((anchor) => getPointForSlot(anchor.slot, anchors, sanitizedPoints));
  const isUploading = status !== "idle" && status !== "error";

  const syncFollowPoint = useCallback((slot: FollowSlot, point: TrackingPoint) => {
    const nextPoints = anchors
      .map((anchor) => {
        if (anchor.slot === slot) return point;
        return getPointForSlot(anchor.slot, anchors, sanitizedPoints);
      })
      .filter((value): value is TrackingPoint => value != null);

    useUploadStore.getState().setTrackingPoints(nextPoints);
  }, [anchors, sanitizedPoints]);

  const handleModeChange = useCallback((nextMode: TrackingMode) => {
    const store = useUploadStore.getState();
    store.setTrackingMode(nextMode);

    if (nextMode === "fixed") {
      store.setTrackingPoints([]);
      if (fixedSpotlight) {
        store.setFreezeAt(previewTime);
      }
      return;
    }

    store.setTrackingPoints(sanitizedPoints);
    store.setFreezeAt(null);
    setSelectedSlot("start");
    setPreviewTime(anchors[0].time);
  }, [anchors, fixedSpotlight, previewTime, sanitizedPoints]);

  const handleTapSpotlight = useCallback((spot: { x: number; y: number }) => {
    const store = useUploadStore.getState();

    if (trackingMode === "follow") {
      const anchor = anchors.find((item) => item.slot === selectedSlot);
      if (!anchor) return;

      const nextPoint = { time: anchor.time, x: spot.x, y: spot.y };
      syncFollowPoint(selectedSlot, nextPoint);
      setPreviewTime(anchor.time);
      toast(`${anchor.label || "선택"} 지점을 저장했습니다.`, "success", { id: "upload-spotlight-save" });
      return;
    }

    store.setSpotlight(spot.x, spot.y);
    store.setFreezeAt(previewTime);
    toast("선수 기준점을 저장했습니다.", "success", { id: "upload-spotlight-save" });
  }, [anchors, previewTime, selectedSlot, syncFollowPoint, trackingMode]);

  const handleReset = useCallback(() => {
    const store = useUploadStore.getState();
    store.setSpotlight(null, null);
    store.setFreezeAt(null);
    store.setTrackingMode("fixed");
    store.setTrackingPoints([]);
    setSelectedSlot("start");
    setPreviewTime(trimStart);
  }, [trimStart]);

  const handleAnchorSelect = useCallback((slot: FollowSlot) => {
    const anchor = anchors.find((item) => item.slot === slot);
    if (!anchor) return;
    setSelectedSlot(slot);
    setPreviewTime(anchor.time);
  }, [anchors]);

  const canUpload = trackingMode === "fixed" ? hasFixedSpotlight : followReady;

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709]">
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-white/40 active:bg-white/8"
          aria-label="뒤로가기"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[15px] font-bold text-white">선수 지정</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent" />
          <div className="h-1 w-6 rounded-full bg-accent/40" />
        </div>
      </div>

      <div className="w-full">
        <PinchZoomVideo
          videoSrc={videoSrc}
          currentTime={previewTime}
          minTime={trimStart}
          maxTime={effectiveTrimEnd}
          onTimeChange={setPreviewTime}
          onPlayingChange={setIsPreviewPlaying}
          onTapSpotlight={handleTapSpotlight}
          pauseOnSpotlightTap
          selectedSpotlight={previewSpotlight}
          enablePlaybackControls
          playbackControlsPosition="below"
          maxHeight="68dvh"
          testId="decorate-video"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-white">재생 방식</p>
              <p className="mt-1 text-[11px] leading-5 text-white/40">
                프로필 카드와 하단 선수 정보는 자동으로 유지됩니다.
              </p>
            </div>
            <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-semibold text-accent">
              {isPreviewPlaying ? "재생 중" : "정지"}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([
              { id: "fixed", label: "고정 확대" },
              { id: "follow", label: "따라가기" },
            ] as const).map((mode) => {
              const selected = trackingMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeChange(mode.id)}
                  className="rounded-2xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: selected ? "rgba(212,168,83,0.14)" : "rgba(255,255,255,0.03)",
                    border: selected ? "1px solid rgba(212,168,83,0.28)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className={`text-[12px] font-semibold ${selected ? "text-accent" : "text-white"}`}>
                    {mode.label}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-white/35">
                    {mode.id === "fixed" ? "한 지점을 기준으로 확대" : "시작, 중간, 끝을 따라 이동"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {trackingMode === "follow" ? (
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-white">따라가기 포인트</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  버튼으로 지점을 고르고, 그 프레임에서 선수를 탭하세요.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-accent">
                {followReady ? "3/3 완료" : `${sanitizedPoints.length}/3`}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {anchors.map((anchor) => {
                const point = getPointForSlot(anchor.slot, anchors, sanitizedPoints);
                const selected = selectedSlot === anchor.slot;

                return (
                  <button
                    key={anchor.slot}
                    type="button"
                    onClick={() => handleAnchorSelect(anchor.slot)}
                    className="rounded-2xl px-3 py-3 text-left"
                    style={{
                      background: selected ? "rgba(212,168,83,0.14)" : "rgba(255,255,255,0.03)",
                      border: selected ? "1px solid rgba(212,168,83,0.28)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p className={`text-[12px] font-semibold ${selected ? "text-accent" : "text-white"}`}>
                      {anchor.label}
                    </p>
                    <p className="mt-1 text-[10px] text-white/45">{formatTime(anchor.time)}</p>
                    <p className="mt-2 text-[10px] font-semibold text-white/55">
                      {point ? "저장됨" : "미지정"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
            <p className="text-[12px] font-semibold text-white">고정 확대 기준</p>
            <p className="mt-1 text-[11px] leading-5 text-white/40">
              원하는 프레임에서 선수를 탭하면 그 위치로 확대 재생됩니다.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/6 bg-black/20 px-3 py-2.5">
              <span className="text-[11px] text-white/55">기준 시점</span>
              <span className="text-[12px] font-semibold text-accent">{formatTime(previewTime)}</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <p className="text-[12px] font-semibold text-white">확대 배율</p>
          <div className="mt-3 flex gap-2">
            {FOCUS_ZOOM_PRESETS.map((preset) => {
              const selected = selectedFocusZoom === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => useUploadStore.getState().setEffects({ focusZoom: preset.value })}
                  className="flex-1 rounded-xl px-3 py-2.5 text-[11px] font-semibold"
                  style={{
                    background: selected ? "rgba(212,168,83,0.14)" : "rgba(255,255,255,0.03)",
                    border: selected ? "1px solid rgba(212,168,83,0.28)" : "1px solid rgba(255,255,255,0.06)",
                    color: selected ? "#D4A853" : "#FAFAFA",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <p className="text-[12px] font-semibold text-white">현재 설정</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/55">
            <div className="rounded-xl border border-white/6 bg-black/20 px-3 py-2.5">
              <p>선택 구간</p>
              <p className="mt-1 text-[12px] font-semibold text-white">
                {formatTime(trimStart)} - {formatTime(effectiveTrimEnd)}
              </p>
            </div>
            <div className="rounded-xl border border-white/6 bg-black/20 px-3 py-2.5">
              <p>재생 방식</p>
              <p className="mt-1 text-[12px] font-semibold text-white">
                {trackingMode === "follow" ? "따라가기" : "고정 확대"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/6 bg-[#070709]/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-xl gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[12px] font-semibold text-white/75"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onUpload}
            disabled={!isReady || isUploading || !canUpload}
            className="flex-1 rounded-2xl px-4 py-3 text-[13px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "#D4A853" }}
          >
            {isUploading ? "업로드 중..." : "이 설정으로 업로드"}
          </button>
        </div>
      </div>
    </div>
  );
}
