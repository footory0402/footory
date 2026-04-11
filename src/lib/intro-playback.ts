export const INTRO_SEQUENCE_DURATION_MS = 3400;
export const INTRO_SEQUENCE_DURATION_SEC = INTRO_SEQUENCE_DURATION_MS / 1000;
export const INTRO_RESTART_THRESHOLD_SEC = 0.08;

export function shouldPlayIntroBeforeVideo({
  introEnabled,
  currentTimeSec,
  trimStartSec,
}: {
  introEnabled: boolean;
  currentTimeSec: number;
  trimStartSec: number;
}) {
  if (!introEnabled) return false;
  if (!Number.isFinite(currentTimeSec) || !Number.isFinite(trimStartSec)) return false;
  return currentTimeSec <= trimStartSec + INTRO_RESTART_THRESHOLD_SEC;
}
