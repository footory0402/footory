export type ShortFormPreset = "clean" | "pulse" | "cinema";

export type ShortFormTag =
  | "슈팅"
  | "드리블"
  | "퍼스트터치"
  | "리프팅"
  | "전진패스"
  | "수비";

export const SHORT_FORM_TAGS: ShortFormTag[] = [
  "슈팅",
  "드리블",
  "퍼스트터치",
  "리프팅",
  "전진패스",
  "수비",
];

export interface ShortFormPresetConfig {
  id: ShortFormPreset;
  label: string;
  accent: string;
  bgmLabel: string;
  bgmHint: string;
  headlineSuffix: string;
}

export interface ShortFormCopy {
  headline: string;
  caption: string;
  badge: string;
  bgmLabel: string;
  bgmHint: string;
}

export type MatchHighlightPreset = "focus" | "tempo" | "recap";

export interface MatchHighlightPresetConfig {
  id: MatchHighlightPreset;
  label: string;
  accent: string;
  bgmLabel: string;
  description: string;
}

export interface MatchRange {
  startSeconds: number;
  endSeconds: number;
  label: string;
}

export interface MatchHighlightCopy {
  title: string;
  subtitle: string;
  bgmLabel: string;
  description: string;
}

export const SHORT_FORM_PRESETS: ShortFormPresetConfig[] = [
  {
    id: "clean",
    label: "Clean Finish",
    accent: "#D4A853",
    bgmLabel: "Sunrise Pulse",
    bgmHint: "밝고 매끈한 템포로 하이라이트 첫 인상을 살립니다.",
    headlineSuffix: "Moment",
  },
  {
    id: "pulse",
    label: "Energy Boost",
    accent: "#59D7C4",
    bgmLabel: "Touchline Drive",
    bgmHint: "드리블과 전개 장면에 잘 맞는 빠른 박자감입니다.",
    headlineSuffix: "Burst",
  },
  {
    id: "cinema",
    label: "Cinematic Focus",
    accent: "#F97360",
    bgmLabel: "Night Spotlight",
    bgmHint: "묵직한 톤으로 한 장면을 강조하는 스타일입니다.",
    headlineSuffix: "Focus",
  },
];

export const MATCH_HIGHLIGHT_PRESETS: MatchHighlightPresetConfig[] = [
  {
    id: "focus",
    label: "Focus Cut",
    accent: "#D4A853",
    bgmLabel: "Match Lift",
    description: "선택 구간을 차분하게 이어 붙이는 기본 하이라이트입니다.",
  },
  {
    id: "tempo",
    label: "Tempo Run",
    accent: "#59D7C4",
    bgmLabel: "Sideline Drive",
    description: "전개 템포가 빠른 장면들을 묶어 보여주는 스타일입니다.",
  },
  {
    id: "recap",
    label: "Weekend Recap",
    accent: "#F97360",
    bgmLabel: "Final Whistle",
    description: "경기 요약처럼 굵직한 장면을 묶는 톤입니다.",
  },
];

const TAG_COPY: Record<ShortFormTag, string[]> = {
  "슈팅": [
    "짧은 터치 뒤, 마무리까지 한 번에.",
    "결정적인 순간을 바로 가져가는 피니시.",
  ],
  "드리블": [
    "첫 스텝에서 이미 공간이 갈립니다.",
    "속도와 터치가 살아 있는 돌파 장면.",
  ],
  "퍼스트터치": [
    "첫 터치 하나로 다음 장면이 편해집니다.",
    "볼이 붙는 순간 플레이 템포가 달라집니다.",
  ],
  "리프팅": [
    "리듬이 끊기지 않는 컨트롤 훈련.",
    "기본기가 눈에 보이는 안정적인 터치.",
  ],
  "전진패스": [
    "시야가 열리는 순간 전개가 시작됩니다.",
    "앞을 보는 패스 한 번이 흐름을 바꿉니다.",
  ],
  "수비": [
    "간격과 타이밍이 살아 있는 수비 장면.",
    "한 발 먼저 읽고 끊어내는 집중력.",
  ],
};

function getPresetConfig(preset: ShortFormPreset): ShortFormPresetConfig {
  return SHORT_FORM_PRESETS.find((item) => item.id === preset) ?? SHORT_FORM_PRESETS[0];
}

export function getShortFormPresetConfig(preset: ShortFormPreset): ShortFormPresetConfig {
  return getPresetConfig(preset);
}

export function getMatchHighlightPresetConfig(
  preset: MatchHighlightPreset
): MatchHighlightPresetConfig {
  return MATCH_HIGHLIGHT_PRESETS.find((item) => item.id === preset) ?? MATCH_HIGHLIGHT_PRESETS[0];
}

export function buildShortFormCopy(
  playerName: string,
  tag: ShortFormTag,
  preset: ShortFormPreset
): ShortFormCopy {
  const safeName = playerName.trim() || "Player Spotlight";
  const presetConfig = getPresetConfig(preset);
  const lines = TAG_COPY[tag] ?? TAG_COPY["슈팅"];
  const lineIndex = preset === "pulse" ? 1 : 0;
  const caption = lines[lineIndex] ?? lines[0];

  return {
    headline: `${safeName} ${presetConfig.headlineSuffix}`,
    caption,
    badge: tag,
    bgmLabel: presetConfig.bgmLabel,
    bgmHint: presetConfig.bgmHint,
  };
}

export function buildMatchHighlightCopy(
  playerName: string,
  preset: MatchHighlightPreset,
  rangeCount: number
): MatchHighlightCopy {
  const safeName = playerName.trim() || "FOOTORY PLAYER";
  const presetConfig = getMatchHighlightPresetConfig(preset);
  const subtitle =
    rangeCount > 0
      ? `${rangeCount}개 구간을 묶은 ${safeName} focus highlight`
      : `${safeName} focus highlight`;

  return {
    title: `${safeName} Match Highlight`,
    subtitle,
    bgmLabel: presetConfig.bgmLabel,
    description: presetConfig.description,
  };
}

export function parseTimestamp(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;
  if (parts.length !== 2 && parts.length !== 3) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function parseMatchRanges(rawValue: string): MatchRange[] {
  return rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [startRaw, endRaw] = line.split("-").map((part) => part.trim());
      const startSeconds = parseTimestamp(startRaw ?? "");
      const endSeconds = parseTimestamp(endRaw ?? "");

      if (startSeconds === null || endSeconds === null || endSeconds <= startSeconds) {
        throw new Error(`잘못된 range 형식: ${line}`);
      }

      return {
        startSeconds,
        endSeconds,
        label: `${formatTimestamp(startSeconds)}-${formatTimestamp(endSeconds)}`,
      };
    });
}
