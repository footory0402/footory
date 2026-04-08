/**
 * spotlight-math.ts
 * 확대 재생(spotlight zoom) 관련 좌표 변환 유틸리티.
 * 설정(PinchZoomVideo)과 재생(ClipPlayerSheet) 양쪽에서 동일한 로직을 사용하기 위한 단일 소스.
 *
 * CSS transform: translate(pan.x%, pan.y%) scale(zoom) 기준으로 작성.
 * pan 단위: % (퍼센트), zoom: 배율 (1 = 원본)
 */

export interface VideoLayout {
  containerW: number;
  containerH: number;
  videoW: number; // 네이티브 영상 해상도
  videoH: number;
}

export interface SpotlightCoord {
  x: number; // 0-1 정규화된 영상 내 좌표
  y: number;
}

export interface PanValue {
  x: number; // % 단위
  y: number;
}

/**
 * object-fit: contain 렌더링 시 실제 영상 표시 영역 계산 (letterbox/pillarbox 오프셋 포함)
 */
export function computeVideoRect(layout: VideoLayout): {
  displayW: number;
  displayH: number;
  offsetX: number;
  offsetY: number;
} {
  const { containerW, containerH, videoW, videoH } = layout;
  const videoAspect = videoW / videoH;
  const containerAspect = containerW / containerH;

  let displayW: number, displayH: number;
  if (videoAspect > containerAspect) {
    // 가로가 더 넓은 영상 → 좌우 꽉 채우고 위아래 letterbox
    displayW = containerW;
    displayH = containerW / videoAspect;
  } else {
    // 세로가 더 긴 영상 → 위아래 꽉 채우고 좌우 pillarbox
    displayH = containerH;
    displayW = containerH * videoAspect;
  }

  return {
    displayW,
    displayH,
    offsetX: (containerW - displayW) / 2,
    offsetY: (containerH - displayH) / 2,
  };
}

/**
 * 영상 내 좌표(0-1) → CSS translate % 값
 * translate(pan.x%, pan.y%) scale(zoom)에서 spotlight 위치가 화면 중앙에 오도록 pan 계산.
 *
 * CSS transform 원리:
 *   화면 내 좌표 = (videoPoint - center) * zoom + pan
 *   중앙에 오려면 위 값이 0이어야 함.
 */
export function spotlightToPan(
  spot: SpotlightCoord,
  layout: VideoLayout,
  zoom: number,
): PanValue {
  const { displayW, displayH, offsetX, offsetY } = computeVideoRect(layout);
  const { containerW, containerH } = layout;

  // 영상 내 좌표 → 컨테이너 내 절대 위치 (letterbox 보정)
  const spotContainerX = offsetX + spot.x * displayW;
  const spotContainerY = offsetY + spot.y * displayH;

  // 해당 지점이 화면 중앙에 오기 위한 pan (% 단위)
  // translate(pan) scale(zoom) 적용 시:
  //   실제 위치 = center + (spotContainer - center) * zoom + panPx
  //   중앙 = 0이 되려면: panPx = (center - spotContainer) * zoom
  const rawPanX = (((containerW / 2 - spotContainerX) * zoom) / containerW) * 100;
  const rawPanY = (((containerH / 2 - spotContainerY) * zoom) / containerH) * 100;

  return clampPan(rawPanX, rawPanY, zoom);
}

/**
 * 현재 zoom/pan 상태에서 화면 중앙에 해당하는 영상 좌표(0-1) 반환
 * spotlightToPan의 역함수 — 설정 저장 시 사용
 */
export function panToSpotlight(
  pan: PanValue,
  layout: VideoLayout,
  zoom: number,
): SpotlightCoord {
  const { displayW, displayH, offsetX, offsetY } = computeVideoRect(layout);
  const { containerW, containerH } = layout;

  // pan → 컨테이너 중앙 기준 절대 위치
  const spotContainerX = containerW / 2 - ((pan.x / 100) * containerW) / zoom;
  const spotContainerY = containerH / 2 - ((pan.y / 100) * containerH) / zoom;

  // 컨테이너 절대 위치 → 영상 내 0-1 좌표 (letterbox 보정 역변환)
  const x = (spotContainerX - offsetX) / displayW;
  const y = (spotContainerY - offsetY) / displayH;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * pan 값을 줌 레벨에 맞게 clamp (과도한 패닝 방지)
 */
export function clampPan(px: number, py: number, zoom: number): PanValue {
  // centered scale 기준: zoom=2일 때 최대 pan = ±50%
  const max = zoom > 1 ? (zoom - 1) * 50 : 0;
  const clampAxis = (value: number) => {
    const clamped = Math.max(-max, Math.min(max, value));
    return Object.is(clamped, -0) ? 0 : clamped;
  };
  return {
    x: clampAxis(px),
    y: clampAxis(py),
  };
}

/**
 * 화면 터치 좌표 → 영상 내 좌표 (0-1)
 * 현재 zoom/pan 상태를 역계산하여 실제 영상 위치 반환
 */
export function screenToVideo(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  layout: VideoLayout,
  zoom: number,
  pan: PanValue,
): SpotlightCoord | null {
  const { displayW, displayH, offsetX, offsetY } = computeVideoRect(layout);
  const { containerW, containerH } = layout;

  // 컨테이너 내 상대 위치 (0-1)
  const relX = (clientX - containerRect.left) / containerW;
  const relY = (clientY - containerRect.top) / containerH;

  // translate(pan%) scale(zoom) 역변환
  // 화면좌표 = (영상좌표 - 0.5) * zoom + 0.5 + panPx/container
  const normX = (relX - 0.5 - pan.x / 100) / zoom + 0.5;
  const normY = (relY - 0.5 - pan.y / 100) / zoom + 0.5;

  // 컨테이너 내 좌표 → 영상 내 좌표 (letterbox 역보정)
  const containerAbsX = normX * containerW;
  const containerAbsY = normY * containerH;
  const videoX = (containerAbsX - offsetX) / displayW;
  const videoY = (containerAbsY - offsetY) / displayH;

  // 영상 영역 밖 클릭은 null
  if (videoX < 0 || videoX > 1 || videoY < 0 || videoY > 1) return null;

  return { x: videoX, y: videoY };
}
