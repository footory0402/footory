import { STAT_LABELS, type PlayerStats } from "../types";

interface RadarChartProps {
  stats: PlayerStats;
  accentColor: string;
  size?: number;
}

const STAT_KEYS: (keyof PlayerStats)[] = [
  "pace", "shooting", "passing", "dribbling", "defense", "physical",
];

function polarToXY(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function makePolygonPoints(cx: number, cy: number, r: number, total: number) {
  return Array.from({ length: total }, (_, i) => {
    const { x, y } = polarToXY(cx, cy, r, i, total);
    return `${x},${y}`;
  }).join(" ");
}

export default function RadarChart({ stats, accentColor, size = 140 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 20;
  const n = STAT_KEYS.length;

  // Data polygon
  const dataPoints = STAT_KEYS.map((key, i) => {
    const value = Math.min(99, Math.max(0, stats[key]));
    const r = (value / 99) * maxR;
    return polarToXY(cx, cy, r, i, n);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={makePolygonPoints(cx, cy, maxR * scale, n)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {STAT_KEYS.map((_, i) => {
        const { x, y } = polarToXY(cx, cy, maxR, i, n);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data fill */}
      <polygon
        points={dataPolygon}
        fill={`${accentColor}25`}
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2.5"
          fill={accentColor}
          stroke="#0a0a0a"
          strokeWidth="1"
        />
      ))}

      {/* Labels */}
      {STAT_KEYS.map((key, i) => {
        const { x, y } = polarToXY(cx, cy, maxR + 14, i, n);
        const value = stats[key];
        return (
          <g key={key}>
            <text
              x={x}
              y={y - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize="7"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {STAT_LABELS[key].en}
            </text>
            <text
              x={x}
              y={y + 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={accentColor}
              fontSize="9"
              fontWeight="800"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
