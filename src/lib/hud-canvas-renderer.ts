/**
 * HUD 오버레이를 Canvas 2D로 렌더링하여 투명 배경 PNG Uint8Array 반환.
 * HudOverlay React 컴포넌트의 레이아웃을 Canvas로 정확히 재현.
 * (html2canvas는 Tailwind v4 oklab 색상 미지원으로 사용 불가)
 */
import type { HudPlayerData, HudConfig } from "@/components/video/hud/types";

interface RenderOptions {
  width: number;
  height: number;
  data: HudPlayerData;
  config: HudConfig;
  markerX?: number;
  markerY?: number;
}

export function renderHudOverlay({
  width, height, data, config, markerX, markerY,
}: RenderOptions): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const s = height / 720; // 720p 기준 스케일

  // ═══════════════════════════════════════
  //  Top Bar — FOOTORY / FOOTBALL HIGHLIGHT
  // ═══════════════════════════════════════
  if (config.showTopBar) {
    const topH = Math.round(36 * s);

    // 배경
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, width, topH);

    // 하단 골드 라인
    const lineGrad = ctx.createLinearGradient(0, topH - 1, width, topH - 1);
    lineGrad.addColorStop(0, data.accentColor);
    lineGrad.addColorStop(0.5, "#E74C3C");
    lineGrad.addColorStop(1, data.accentColor);
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, topH - 2, width, 2);

    const px = Math.round(14 * s);

    // FOOTORY
    ctx.fillStyle = "#D4A853";
    ctx.font = `900 ${Math.round(13 * s)}px "Rajdhani", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("FOOTORY", px, topH / 2);

    const footoryW = ctx.measureText("FOOTORY").width;

    // FOOTBALL HIGHLIGHT
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `600 ${Math.round(9 * s)}px "Rajdhani", sans-serif`;
    ctx.fillText("FOOTBALL HIGHLIGHT", px + footoryW + Math.round(10 * s), topH / 2);
  }

  // ═══════════════════════════════════════
  //  Bottom Bar — MiniCard + InfoBar + GoalCounter
  // ═══════════════════════════════════════
  const showBottom = config.showMiniCard || config.showInfoBar || config.showGoalCounter;
  if (showBottom) {
    const barH = Math.round(90 * s);
    const barY = height - barH;

    // 골드 액센트 라인
    const accGrad = ctx.createLinearGradient(0, barY - 2, width, barY - 2);
    accGrad.addColorStop(0, data.accentColor);
    accGrad.addColorStop(0.5, "#E74C3C");
    accGrad.addColorStop(1, data.accentColor);
    ctx.fillStyle = accGrad;
    ctx.fillRect(0, barY - 2, width, 2);

    // 반투명 배경
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, barY, width, barH);

    const pad = Math.round(10 * s);
    const miniW = Math.round(width * 0.25);
    const gcW = Math.round(width * 0.15);

    // ── MiniCard (좌 25%) ──
    if (config.showMiniCard) {
      // 그래디언트 배경
      const cardGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
      cardGrad.addColorStop(0, hexAlpha(data.mainColor, 0.35));
      cardGrad.addColorStop(1, hexAlpha(data.mainColor, 0.1));
      ctx.fillStyle = cardGrad;
      ctx.fillRect(0, barY, miniW, barH);

      let textY = barY + pad;

      // 클럽명
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `600 ${Math.round(8 * s)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(data.club, pad, textY);
      textY += Math.round(14 * s);

      // 이름 (lastName + firstName)
      const nameSize = Math.round(18 * s);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${nameSize}px "Oswald", sans-serif`;
      ctx.fillText(data.lastName, pad, textY);
      const lastW = ctx.measureText(data.lastName).width;

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `600 ${Math.round(13 * s)}px "Oswald", sans-serif`;
      ctx.fillText(data.firstName, pad + lastW + Math.round(4 * s), textY + Math.round(3 * s));

      // 등번호 (우측)
      ctx.fillStyle = data.accentColor;
      ctx.font = `800 ${Math.round(26 * s)}px "Oswald", sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(data.number, miniW - pad, barY + pad);
      ctx.textAlign = "left";

      // 포지션
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `700 ${Math.round(11 * s)}px "Oswald", sans-serif`;
      ctx.fillText(data.positionShort ?? data.position, pad, barY + barH - pad - Math.round(2 * s));
    }

    // ── InfoBar (중앙) ──
    if (config.showInfoBar) {
      const infoX = config.showMiniCard ? miniW : 0;
      const infoW = width - infoX - (config.showGoalCounter ? gcW : 0);

      const columns = [
        { label: "FOOTBALL CLUB", value: data.clubFull || data.club },
        { label: "POSITION", value: data.position },
        { label: "BIRTH DATE", value: data.birthDate },
        { label: "HEIGHT / WEIGHT", value: `${data.height}CM / ${data.weight}KG` },
        { label: "FOOT", value: data.foot || "Right" },
      ];

      const colW = infoW / columns.length;
      const labelSize = Math.round(7.5 * s);
      const valueSize = Math.round(11 * s);

      columns.forEach((col, i) => {
        const cx = infoX + i * colW + colW / 2;

        // 구분선
        if (i > 0) {
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(infoX + i * colW, barY + pad + Math.round(4 * s));
          ctx.lineTo(infoX + i * colW, barY + barH - pad - Math.round(4 * s));
          ctx.stroke();
        }

        // 라벨
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = `600 ${labelSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(col.label, cx, barY + barH * 0.35);

        // 값
        ctx.fillStyle = data.accentColor;
        ctx.font = `700 ${valueSize}px "Oswald", sans-serif`;
        ctx.fillText(truncateText(ctx, col.value || "-", colW - Math.round(8 * s)), cx, barY + barH * 0.65);
      });

      ctx.textAlign = "left";
    }

    // ── GoalCounter (우 15%) ──
    if (config.showGoalCounter) {
      const gcX = width - gcW;
      const gcCx = gcX + gcW / 2;

      // 구분선
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gcX, barY + pad);
      ctx.lineTo(gcX, barY + barH - pad);
      ctx.stroke();

      // G O A L
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `700 ${Math.round(8 * s)}px "Oswald", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("G O A L", gcCx, barY + pad + Math.round(2 * s));

      // 숫자
      ctx.fillStyle = data.accentColor;
      ctx.font = `800 ${Math.round(32 * s)}px "Oswald", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(String(config.goalCount), gcCx, barY + barH / 2 + Math.round(4 * s));

      // 클럽 약어 뱃지
      const badgeR = Math.round(10 * s);
      const badgeY = barY + barH - pad - badgeR;
      ctx.fillStyle = hexAlpha(data.mainColor, 0.4);
      ctx.beginPath();
      ctx.arc(gcCx, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexAlpha(data.accentColor, 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${Math.round(7 * s)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(data.club.substring(0, 3).toUpperCase(), gcCx, badgeY);

      ctx.textAlign = "left";
    }
  }

  // ═══════════════════════════════════════
  //  선수 마커 (EA FC 다이아몬드)
  // ═══════════════════════════════════════
  if (markerX !== undefined && markerY !== undefined) {
    const mx = markerX * width;
    const my = markerY * height;
    const dSize = Math.round(10 * s);

    // 다이아몬드
    ctx.save();
    ctx.shadowColor = "rgba(212,168,83,0.6)";
    ctx.shadowBlur = Math.round(20 * s);
    ctx.translate(mx, my - dSize * 3.5);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = data.accentColor;
    ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
    ctx.restore();

    // 수직선
    ctx.save();
    ctx.shadowBlur = 0;
    const lineGrad = ctx.createLinearGradient(mx, my - dSize * 2.5, mx, my);
    lineGrad.addColorStop(0, data.accentColor);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = Math.max(1.5, Math.round(2 * s));
    ctx.beginPath();
    ctx.moveTo(mx, my - dSize * 2.5);
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.restore();

    // 이름표
    const tagName = `${data.lastName}${data.firstName}`;
    const tagNum = data.number ? `#${data.number}` : "";
    const tagFontSize = Math.round(10 * s);
    ctx.font = `800 ${tagFontSize}px sans-serif`;
    const nameW = ctx.measureText(tagName).width;
    const numW = tagNum ? ctx.measureText(tagNum).width + Math.round(6 * s) : 0;
    const tagPadX = Math.round(10 * s);
    const tagW = nameW + numW + tagPadX * 2;
    const tagH = Math.round(22 * s);
    const tagX = mx - tagW / 2;
    const tagY = my + Math.round(4 * s);

    // 이름표 배경
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    roundRect(ctx, tagX, tagY, tagW, tagH, Math.round(4 * s));
    ctx.fill();
    ctx.strokeStyle = `${data.accentColor}55`;
    ctx.lineWidth = 1;
    roundRect(ctx, tagX, tagY, tagW, tagH, Math.round(4 * s));
    ctx.stroke();

    // 이름
    ctx.fillStyle = data.accentColor;
    ctx.font = `800 ${tagFontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(tagName, tagX + tagPadX, tagY + tagH / 2);

    // 등번호
    if (tagNum) {
      ctx.fillStyle = `${data.accentColor}77`;
      ctx.fillText(tagNum, tagX + tagPadX + nameW + Math.round(4 * s), tagY + tagH / 2);
    }
  }

  // Canvas → PNG Uint8Array
  const dataUrl = canvas.toDataURL("image/png");
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hexAlpha(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
