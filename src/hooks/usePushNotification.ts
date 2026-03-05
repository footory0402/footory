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

    type FirebaseAppModule = {
      initializeApp: (config: {
        apiKey?: string;
        projectId?: string;
        messagingSenderId?: string;
        appId?: string;
      }) => unknown;
    };
    type FirebaseMessagingModule = {
      getMessaging: (app: unknown) => unknown;
      getToken: (messaging: unknown, options: { vapidKey?: string }) => Promise<string | null>;
    };

    let firebaseApp: FirebaseAppModule;
    let firebaseMessaging: FirebaseMessagingModule;
    try {
      // Use indirect dynamic import to avoid TS module resolution errors
      // when firebase is not installed
      const importModule = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
      firebaseApp = await importModule("firebase/app") as FirebaseAppModule;
      firebaseMessaging = await importModule("firebase/messaging") as FirebaseMessagingModule;
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
