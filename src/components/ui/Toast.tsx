"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  id?: string;
}

export function toast(
  message: string,
  type: "success" | "error" | "info" = "info",
  options?: ToastOptions,
) {
  const safeMessage = String(message ?? "").trim();
  if (!safeMessage) return;

  switch (type) {
    case "success":
      sonnerToast.success(safeMessage, options);
      break;
    case "error":
      sonnerToast.error(safeMessage, options);
      break;
    default:
      sonnerToast(safeMessage, options);
  }
}

export const useToast = {
  getState: () => ({
    add: (message: string, type?: "success" | "error" | "info", options?: ToastOptions) =>
      toast(message, type, options),
  }),
};

export default function ToastContainer() {
  return null;
}
