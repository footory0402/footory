/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This file must be in /public for Firebase to register it

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY__ || "",
  projectId: self.__FIREBASE_PROJECT_ID__ || "",
  messagingSenderId: self.__FIREBASE_SENDER_ID__ || "",
  appId: self.__FIREBASE_APP_ID__ || "",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? "Footory", {
    body: body ?? "",
    icon: icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data: payload.data,
    tag: payload.data?.type ?? "default",
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window or open new
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
