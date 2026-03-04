"use client";

import { useState, useCallback } from "react";

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [loading, setLoading] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await registerToken();
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, loading, requestPermission };
}

async function registerToken() {
  try {
    // Register service worker
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    // Firebase SDK must be installed: npm install firebase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let firebaseApp: any, firebaseMessaging: any;
    try {
      // Use indirect dynamic import to avoid TS module resolution errors
      // when firebase is not installed
      const importModule = new Function("m", "return import(m)") as (m: string) => Promise<any>;
      firebaseApp = await importModule("firebase/app");
      firebaseMessaging = await importModule("firebase/messaging");
    } catch {
      console.warn("[push] Firebase SDK not installed. Run: npm install firebase");
      return;
    }

    const app = firebaseApp.initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

    const messaging = firebaseMessaging.getMessaging(app);
    const token = await firebaseMessaging.getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      await fetch("/api/push/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          deviceInfo: navigator.userAgent.slice(0, 100),
        }),
      });
    }
  } catch (err) {
    console.error("[push] Failed to register token:", err);
  }
}
