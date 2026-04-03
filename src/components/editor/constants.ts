export const POSITIONS = [
  "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF",
] as const;

export const CARD_THEMES = [
  { id: "flame",     name: "Inferno",  color: "#7B1315", accent: "#F97316" },
  { id: "ocean",     name: "Abyss",    color: "#0B2A5A", accent: "#38BDF8" },
  { id: "forest",    name: "Venom",    color: "#14532D", accent: "#4ADE80" },
  { id: "gold",      name: "Gilded",   color: "#5C2D00", accent: "#FBBF24" },
  { id: "amethyst",  name: "Spectre",  color: "#3B0764", accent: "#E879F9" },
  { id: "midnight",  name: "Phantom",  color: "#0F172A", accent: "#6366F1" },
  { id: "silver",    name: "Stealth",  color: "#1E293B", accent: "#CBD5E1" },
  { id: "coral",     name: "Blaze",    color: "#7C2D12", accent: "#FB923C" },
] as const;

export type ThemeId = (typeof CARD_THEMES)[number]["id"];

export type TemplateId = "fifa";

export const STADIUM_BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="#1a1a2e" width="600" height="400"/><ellipse cx="300" cy="350" rx="280" ry="60" fill="#16213e" opacity=".6"/><rect x="60" y="80" width="480" height="240" rx="4" fill="none" stroke="#0f3460" stroke-width="1.5" opacity=".4"/><line x1="300" y1="80" x2="300" y2="320" stroke="#0f3460" stroke-width="1" opacity=".3"/><circle cx="300" cy="200" r="50" fill="none" stroke="#0f3460" stroke-width="1" opacity=".3"/><rect x="60" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/><rect x="460" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/></svg>`;

export const STADIUM_BG = `data:image/svg+xml,${encodeURIComponent(STADIUM_BG_SVG)}`;

export const FOOT_OPTIONS = ["오른발", "왼발", "양발"] as const;
