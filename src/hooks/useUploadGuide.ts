"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "footory_upload_guide_v2";

export type GuideStep = "flow" | "focus";

export function useUploadGuide() {
  const [step, setStep] = useState<GuideStep | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "done") return;
      if (stored === "focus") {
        setStep("focus");
        return;
      }
      setStep("flow");
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  const dismissStep = useCallback(() => {
    setStep((prev) => {
      if (prev === "flow") {
        try { localStorage.setItem(STORAGE_KEY, "focus"); } catch {}
        return "focus";
      }
      try { localStorage.setItem(STORAGE_KEY, "done"); } catch {}
      return null;
    });
  }, []);

  const skipAll = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "done"); } catch {}
    setStep(null);
  }, []);

  return { guideStep: step, dismissStep, skipAll };
}
