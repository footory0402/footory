"use client";

import { useEffect } from "react";
import { create } from "zustand";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: ToastItem[];
  add: (message: string, type?: ToastItem["type"]) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastItem["type"] = "info") {
  useToast.getState().add(message, type);
}

export default function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const remove = useToast((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`animate-fade-up cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-medium shadow-lg backdrop-blur-md ${
            t.type === "error"
              ? "bg-red/90 text-white"
              : t.type === "success"
                ? "bg-green/90 text-white"
                : "bg-card/95 text-text-1"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
