const MIN_UI_ASPECT_RATIO = 9 / 16;
const MAX_UI_ASPECT_RATIO = 16 / 9;

function safeRound(value: number) {
  return Number(value.toFixed(4));
}

export function resolveUiVideoAspectRatio(size?: { w: number; h: number } | null) {
  if (!size || size.w <= 0 || size.h <= 0) {
    return safeRound(16 / 9);
  }
  const raw = size.w / size.h;
  return safeRound(Math.min(MAX_UI_ASPECT_RATIO, Math.max(MIN_UI_ASPECT_RATIO, raw)));
}

export function resolveThumbnailCanvasSize(size: { w: number; h: number }, longSide = 640) {
  const safeLongSide = Math.max(128, Math.round(longSide));
  const { w, h } = size;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: safeLongSide, height: Math.round((safeLongSide * 9) / 16) };
  }

  const aspect = w / h;
  if (aspect >= 1) {
    return {
      width: safeLongSide,
      height: Math.max(1, Math.round(safeLongSide / aspect)),
    };
  }

  return {
    width: Math.max(1, Math.round(safeLongSide * aspect)),
    height: safeLongSide,
  };
}
