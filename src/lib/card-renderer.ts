/**
 * 저장된 선수카드 데이터를 Canvas로 렌더링하여 PNG Blob을 반환합니다.
 * 서버사이드 의존성 없이 브라우저에서만 동작합니다.
 */

interface CardData {
  firstName?: string;
  lastName?: string;
  number?: string;
  position?: string;
  club?: string;
  customClubName?: string;
  age?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  foot?: string;
  nationality?: string;
  photoUrl?: string;
}

interface SavedCard {
  template: string;
  main_color: string;
  accent_color: string;
  club_name: string | null;
  card_data: CardData;
}

const W = 720;
const H = 1040;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderCardToBlob(card: SavedCard): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const d = card.card_data;
  const mainColor = card.main_color || "#37474F";
  const accentColor = card.accent_color || "#78909C";
  const clubName = card.club_name || d.customClubName || d.club || "";

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, mainColor);
  bgGrad.addColorStop(0.5, "#0a0a0a");
  bgGrad.addColorStop(1, accentColor + "66");
  ctx.fillStyle = bgGrad;
  drawRoundedRect(ctx, 0, 0, W, H, 32);
  ctx.fill();

  // Subtle grid overlay
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Top accent glow
  const glow = ctx.createRadialGradient(W - 80, 80, 0, W - 80, 80, 200);
  glow.addColorStop(0, accentColor + "33");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 300);

  // Number
  ctx.font = "900 96px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.shadowColor = accentColor + "66";
  ctx.shadowBlur = 30;
  ctx.fillText(d.number || "9", 48, 40);
  ctx.shadowBlur = 0;

  // Position
  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText(d.position || "ST", 52, 150);
  ctx.letterSpacing = "0px";

  // Club badge (top right)
  const shortClub = clubName.replace("U12", "").trim();
  ctx.fillStyle = mainColor;
  drawRoundedRect(ctx, W - 120, 40, 80, 80, 12);
  ctx.fill();
  const clubGrad = ctx.createLinearGradient(W - 120, 40, W - 40, 120);
  clubGrad.addColorStop(0, mainColor);
  clubGrad.addColorStop(1, accentColor);
  ctx.fillStyle = clubGrad;
  drawRoundedRect(ctx, W - 120, 40, 80, 80, 12);
  ctx.fill();
  ctx.font = "700 14px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const clubLines = shortClub.length > 8 ? [shortClub.substring(0, 8), shortClub.substring(8)] : [shortClub];
  clubLines.forEach((line, i) => {
    ctx.fillText(line, W - 80, 80 + (i - (clubLines.length - 1) / 2) * 16);
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Photo circle
  const photoX = 60;
  const photoY = 200;
  const photoR = 120;
  ctx.save();
  ctx.beginPath();
  ctx.arc(photoX + photoR, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.closePath();

  if (d.photoUrl) {
    try {
      const img = await loadImage(d.photoUrl);
      ctx.clip();
      ctx.drawImage(img, photoX, photoY, photoR * 2, photoR * 2);
    } catch {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
  }
  ctx.restore();

  // Photo ring
  ctx.beginPath();
  ctx.arc(photoX + photoR, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor + "44";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Name (right of photo)
  const nameX = photoX + photoR * 2 + 40;
  ctx.font = "500 18px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.letterSpacing = "6px";
  ctx.fillText((d.firstName || "").toUpperCase(), nameX, 260);
  ctx.letterSpacing = "0px";

  ctx.font = "900 52px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText((d.lastName || "").toUpperCase(), nameX, 290);

  // Club tag
  ctx.fillStyle = accentColor + "33";
  const tagText = d.club || clubName;
  const tagWidth = ctx.measureText(tagText).width + 20;
  drawRoundedRect(ctx, nameX, 360, tagWidth, 28, 4);
  ctx.fill();
  ctx.font = "700 13px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(tagText, nameX + 10, 367);

  // Info grid
  const gridY = 480;
  const gridData = [
    { label: "생년월일", value: d.birthDate || "-" },
    { label: "나이", value: d.age ? `${d.age}세` : "-" },
    { label: "키", value: d.height ? `${d.height}cm` : "-" },
    { label: "몸무게", value: d.weight ? `${d.weight}kg` : "-" },
    { label: "주발", value: d.foot || "-" },
    { label: "국적", value: d.nationality || "KOR" },
  ];

  const cellW = (W - 96) / 2;
  const cellH = 72;

  gridData.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 48 + col * (cellW + 2);
    const y = gridY + row * (cellH + 2);

    ctx.fillStyle = "rgba(10,10,12,0.85)";
    drawRoundedRect(ctx, x, y, cellW, cellH, 8);
    ctx.fill();

    ctx.font = "600 12px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(item.label.toUpperCase(), x + 16, y + 18);

    ctx.font = "700 20px sans-serif";
    ctx.fillStyle = accentColor;
    ctx.fillText(item.value, x + 16, y + 42);
  });

  // Footer
  ctx.font = "600 12px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "4px";
  ctx.fillText("FOOTORY.COM", W / 2, H - 40);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

/**
 * 저장된 카드 데이터를 API에서 가져와서 PNG Blob으로 렌더링합니다.
 * 카드가 없으면 null을 반환합니다.
 */
export async function fetchAndRenderCard(): Promise<Blob | null> {
  try {
    const res = await fetch("/api/player-card");
    if (!res.ok) return null;
    const { card } = await res.json();
    if (!card) return null;
    return renderCardToBlob(card);
  } catch {
    return null;
  }
}
