import { getStatMeta } from "./constants";

function formatNumber(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(1)));
}

export function normalizeStatUnit(statType: string, unit?: string) {
  const meta = getStatMeta(statType);
  if (meta.unit) {
    return meta.unit;
  }

  if (unit === "s") {
    return "초";
  }

  return unit ?? "";
}

export function isTimeStatUnit(unit: string) {
  return unit === "분:초";
}

export function formatTimeStatValue(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatStatValue(value: number, statType: string, unit?: string) {
  const displayUnit = normalizeStatUnit(statType, unit);
  if (isTimeStatUnit(displayUnit)) {
    return formatTimeStatValue(value);
  }

  return formatNumber(value);
}

export function formatStatDelta(delta: number, statType: string, unit?: string) {
  const absDelta = Math.abs(delta);
  const displayUnit = normalizeStatUnit(statType, unit);
  if (isTimeStatUnit(displayUnit)) {
    return formatTimeStatValue(absDelta);
  }

  return formatNumber(absDelta);
}
