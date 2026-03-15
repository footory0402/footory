const CACHE_NAME = "footory-v4";
const NAV_CACHE = "footory-nav-v1";

// App shell: 오프라인에서도 빠르게 로드할 핵심 자원
const APP_SHELL = [
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install: app shell 프리캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: 이전 캐시 정리 + Navigation Preload 활성화
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== NAV_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      // Navigation Preload: SW 부팅 중에도 네트워크 요청 시작 → 100-500ms 절약
      self.registration.navigationPreload?.enable().catch(() => {}),
    ])
  );
  self.clients.claim();
});

// Fetch: 전략 분기
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // iOS Safari: scheme이 http/https가 아닌 요청 무시
  const url = new URL(request.url);
  if (!url.protocol.startsWith("http")) return;

  // API, auth 요청은 캐시하지 않음
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    request.method !== "GET"
  ) {
    return;
  }

  // ── 네비게이션: Stale-While-Revalidate (PWA 즉시 로드 핵심) ──
  if (request.mode === "navigate") {
    // 1) 백그라운드 네트워크 fetch 시작 (preload 있으면 사용)
    const networkFetch = (event.preloadResponse || Promise.resolve(null))
      .then((preloaded) => preloaded || fetch(request))
      .then(async (response) => {
        // 2xx HTML 응답만 캐시 (리다이렉트, 에러 응답 제외)
        if (response && response.ok) {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("text/html")) {
            try {
              const cache = await caches.open(NAV_CACHE);
              await cache.put(request, response.clone());
            } catch {}
          }
        }
        return response;
      })
      .catch(() => null);

    // SW가 백그라운드 fetch 완료까지 살아있도록 보장
    event.waitUntil(networkFetch);

    // Cache-first → 캐시 있으면 즉시 제공, 없으면 네트워크 대기
    event.respondWith(
      caches
        .open(NAV_CACHE)
        .then((cache) => cache.match(request))
        .then((cached) => {
          if (cached) return cached; // ← 즉시 응답! (PWA 1초 미만 로드)
          // 캐시 없음 (최초 방문): 네트워크 대기
          return networkFetch.then(
            (response) =>
              response ||
              new Response("오프라인 상태입니다", {
                status: 503,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              })
          );
        })
    );
    return;
  }

  // ── 정적 자산 (JS, CSS, 이미지, 폰트): Cache First ──
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── 기타 GET 요청: Network First ──
  event.respondWith(networkFirst(request));
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.match(
      /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|avif|ico)$/
    )
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("오프라인 상태입니다", { status: 503 });
  }
}
