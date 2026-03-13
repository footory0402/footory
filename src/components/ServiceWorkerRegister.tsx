"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // 개발 환경에서는 SW 해제 — 캐시가 코드 변경을 가림
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    // Defer SW registration to not block initial render
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    } else {
      setTimeout(() => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }, 2000);
    }
  }, []);

  return null;
}
