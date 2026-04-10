"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "footory_upload_guide_v3";

export type GuideStep = "focus_pick" | "focus_zoom";

const GUIDE_SEQUENCE: GuideStep[] = ["focus_pick", "focus_zoom"];

export function useUploadGuide() {
  const [step, setStep] = useState<GuideStep | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "done") return null;
      if (stored && GUIDE_SEQUENCE.includes(stored as GuideStep)) {
        return stored as GuideStep;
      }
      return GUIDE_SEQUENCE[0];
    } catch {
      return null;
    }
  });

  const dismissStep = useCallback(() => {
    setStep((prev) => {
      if (!prev) return null;
      const currentIndex = GUIDE_SEQUENCE.indexOf(prev);
      const nextStep = GUIDE_SEQUENCE[currentIndex + 1] ?? null;
      try {
        localStorage.setItem(STORAGE_KEY, nextStep ?? "done");
      } catch {}
      return nextStep;
    });
  }, []);

  const resetGuide = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setStep(GUIDE_SEQUENCE[0]);
  }, []);

  const closeGuide = useCallback(() => {
    setStep(null);
  }, []);

  const skipAll = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "done");
    } catch {}
    setStep(null);
  }, []);

  return { guideStep: step, dismissStep, resetGuide, closeGuide, skipAll };
}
