"use client";

import { useState, useCallback } from "react";

export type RemovalStatus = "idle" | "loading" | "processing" | "done" | "error";

export function useBackgroundRemoval() {
  const [status, setStatus] = useState<RemovalStatus>("idle");

  const removeBackground = useCallback(async (imageUrl: string): Promise<string | null> => {
    setStatus("loading");

    try {
      const { removeBackground: removeBg } = await import("@imgly/background-removal");

      setStatus("processing");

      const blob = await removeBg(imageUrl, {
        output: { format: "image/png", quality: 0.9 },
      });

      const url = URL.createObjectURL(blob);
      setStatus("done");
      return url;
    } catch (err) {
      console.error("Background removal failed:", err);
      setStatus("error");
      return null;
    }
  }, []);

  return { removeBackground, status };
}
