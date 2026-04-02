"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "footory_upload_guide_v1";

export type GuideStep = "tap" | "pinch";

export function useUploadGuide() {
  const [step, setStep] = useState<GuideStep | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setStep("tap");
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  const dismissStep = useCallback(() => {
    setStep((prev) => {
      if (prev === "tap") return "pinch";
      // pinch → done
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      return null;
    });
  }, []);

  const skipAll = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setStep(null);
  }, []);

  return { guideStep: step, dismissStep, skipAll };
}
