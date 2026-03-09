"use client";

import { useState, useEffect, useCallback } from "react";
import type { LinkedChild } from "@/lib/home-types";

interface UseLinkedChildrenOptions {
  initialChildren?: LinkedChild[];
  hasInitialData?: boolean;
}

export type { LinkedChild } from "@/lib/home-types";

export function useLinkedChildren({
  initialChildren = [],
  hasInitialData = false,
}: UseLinkedChildrenOptions = {}) {
  const [children, setChildren] = useState<LinkedChild[]>(() => initialChildren);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parent/link");
      if (!res.ok) {
        if (res.status === 403) { setError("not_parent"); return; }
        throw new Error("Failed to fetch children");
      }
      const data: LinkedChild[] = await res.json();
      setChildren(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialData) {
      void fetchChildren();
    }
  }, [fetchChildren, hasInitialData]);

  const linkChild = useCallback(async (handle: string) => {
    const res = await fetch("/api/parent/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to link");
    }
    await fetchChildren();
  }, [fetchChildren]);

  const unlinkChild = useCallback(async (childId: string) => {
    const res = await fetch(`/api/parent/link?childId=${childId}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to unlink");
    }
    await fetchChildren();
  }, [fetchChildren]);

  return { children, loading, error, linkChild, unlinkChild, refetch: fetchChildren };
}
