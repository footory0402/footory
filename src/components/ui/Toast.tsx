"use client";

import { toast as sonnerToast } from "sonner";

export function toast(message: string, type: "success" | "error" | "info" = "info") {
  switch (type) {
    case "success":
      sonnerToast.success(message);
      break;
    case "error":
      sonnerToast.error(message);
      break;
    default:
      sonnerToast(message);
  }
}

export const useToast = {
  getState: () => ({
    add: (message: string, type?: "success" | "error" | "info") => toast(message, type),
  }),
};

export default function ToastContainer() {
  return null;
}
