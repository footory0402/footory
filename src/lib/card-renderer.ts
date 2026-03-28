/**
 * 저장된 선수카드 데이터를 IntroCard React 컴포넌트로 렌더링하여 PNG Blob을 반환합니다.
 * html2canvas로 DOM → Canvas 캡처 방식 사용 (16:9, 960×540).
 */

// 출력 해상도 — 16:9
const CARD_W = 960;
const CARD_H = 540;

/**
 * /api/player-card에서 카드 데이터를 가져와 IntroCard 컴포넌트를 PNG로 렌더링합니다.
 * 카드가 없으면 null 반환.
 */
export async function fetchAndRenderCard(): Promise<Blob | null> {
  try {
    const res = await fetch("/api/player-card");
    if (!res.ok) return null;
    const { card } = await res.json();
    if (!card) return null;
    return renderIntroCardToBlob(card);
  } catch {
    return null;
  }
}

/**
 * 카드 DB 레코드를 받아 IntroCard React 컴포넌트를 화면 밖 DOM에 마운트하고
 * html2canvas로 캡처해 PNG Blob으로 반환합니다.
 */
async function renderIntroCardToBlob(card: Record<string, unknown>): Promise<Blob> {
  // 1. card_data → HudPlayerData 변환
  const { buildHudData } = await import("./hud-data-builder");
  const hudData = buildHudData(card);

  // 2. 화면 밖 컨테이너 생성
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "top:-9999px",
    "left:-9999px",
    `width:${CARD_W}px`,
    `height:${CARD_H}px`,
    "overflow:hidden",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(container);

  // React root — 정리를 위해 스코프 밖에 선언
  let unmountRoot: (() => void) | null = null;

  try {
    // 3. React 컴포넌트 마운트
    const [{ createRoot }, { createElement }, { default: IntroCard }] = await Promise.all([
      import("react-dom/client"),
      import("react"),
      import("@/components/video/hud/IntroCard"),
    ]);

    const root = createRoot(container);
    unmountRoot = () => root.unmount();
    root.render(createElement(IntroCard, { data: hudData }));

    // 4. 폰트 로드 완료 + 렌더 사이클 2회 대기
    await document.fonts.ready;
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );

    // 5. html2canvas 캡처
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(container, {
      width: CARD_W,
      height: CARD_H,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: 1,
      logging: false,
    });

    // 6. PNG Blob 변환
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob 실패"))),
        "image/png"
      );
    });
  } finally {
    unmountRoot?.();
    document.body.removeChild(container);
  }
}
