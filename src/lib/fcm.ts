"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, deleteToken, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getMessaging(app);
}

export async function requestPushPermission(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.error("[FCM] Failed to get token:", err);
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  await fetch("/api/push-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: "web" }),
  });
}

export async function removePushToken(): Promise<void> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  try {
    await deleteToken(messaging);
    await fetch("/api/push-tokens", { method: "DELETE" });
  } catch (err) {
    console.error("[FCM] Failed to remove token:", err);
  }
}
