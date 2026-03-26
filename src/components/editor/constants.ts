export const POSITIONS = [
  "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF",
] as const;

export const CLUBS = [
  { name: "FC Seoul U12", color: "#C0392B", accent: "#E74C3C" },
  { name: "Jeonbuk U12", color: "#2E7D32", accent: "#4CAF50" },
  { name: "Ulsan U12", color: "#1565C0", accent: "#42A5F5" },
  { name: "Suwon U12", color: "#1565C0", accent: "#E53935" },
  { name: "Incheon U12", color: "#0D47A1", accent: "#1976D2" },
  { name: "Gangwon U12", color: "#E65100", accent: "#FF9800" },
  { name: "Daejeon U12", color: "#6A1B9A", accent: "#AB47BC" },
  { name: "Pohang U12", color: "#B71C1C", accent: "#EF5350" },
  { name: "Jeju U12", color: "#E65100", accent: "#FF6D00" },
  { name: "Gimcheon U12", color: "#1B5E20", accent: "#66BB6A" },
  { name: "직접 입력", color: "#37474F", accent: "#78909C" },
] as const;

export const TEMPLATES = [
  { id: "fifa", name: "FIFA 스타일", desc: "EA FC 카드 느낌" },
  { id: "broadcast", name: "방송 스타일", desc: "TV 중계 인트로" },
  { id: "minimal", name: "미니멀", desc: "깔끔한 프로필" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const STADIUM_BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="#1a1a2e" width="600" height="400"/><ellipse cx="300" cy="350" rx="280" ry="60" fill="#16213e" opacity=".6"/><rect x="60" y="80" width="480" height="240" rx="4" fill="none" stroke="#0f3460" stroke-width="1.5" opacity=".4"/><line x1="300" y1="80" x2="300" y2="320" stroke="#0f3460" stroke-width="1" opacity=".3"/><circle cx="300" cy="200" r="50" fill="none" stroke="#0f3460" stroke-width="1" opacity=".3"/><rect x="60" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/><rect x="460" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/></svg>`;

export const STADIUM_BG = `data:image/svg+xml,${encodeURIComponent(STADIUM_BG_SVG)}`;

export const FOOT_OPTIONS = ["오른발", "왼발", "양발"] as const;
