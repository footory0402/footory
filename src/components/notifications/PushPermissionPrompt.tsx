"use client";

import { useState } from "react";

const PUSH_DISMISS_KEY = "footory_push_dismiss_count";
const MAX_DISMISS = 3;

export default function PushPermissionPrompt({ onClose }: { onClose: () => void }) {
  const [requesting, setRequesting] = useState(false);

  const handleAccept = async () => {
    setRequesting(true);
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Token registration handled by usePushNotification hook in settings
          console.log("[Push] Permission granted");
        }
      }
    } catch (err) {
      console.error("[Push] Error:", err);
    } finally {
      onClose();
    }
  };

  const handleDismiss = () => {
    const count = Number(localStorage.getItem(PUSH_DISMISS_KEY) || "0") + 1;
    localStorage.setItem(PUSH_DISMISS_KEY, String(count));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8">
      <div className="w-full max-w-[400px] animate-slide-up rounded-[14px] bg-card p-5">
        <p className="text-center text-lg font-bold text-text-1">
          영상이 업로드됐어요!
        </p>
        <p className="mt-2 text-center text-sm text-text-2">
          다른 선수가 응원하면 알려드릴까요?
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-[10px] bg-elevated py-3 text-sm font-medium text-text-2"
          >
            나중에
          </button>
          <button
            onClick={handleAccept}
            disabled={requesting}
            className="flex-1 rounded-[10px] bg-accent py-3 text-sm font-bold text-bg disabled:opacity-50"
          >
            {requesting ? "..." : "네, 알려주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowPushPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return false;
  if (Notification.permission === "denied") return false;

  const dismissCount = Number(localStorage.getItem(PUSH_DISMISS_KEY) || "0");
  return dismissCount < MAX_DISMISS;
}
