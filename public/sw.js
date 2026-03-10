const CACHE_NAME = "footory-v2";

// App shell: 오프라인에서도 빠르게 로드할 핵심 자원
// "/" 제거 — SSR 페이지를 SW가 캐시하면 hydration mismatch + 무한 리로드 발생
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

// Activate: 이전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: 전략 분기
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API, auth 요청은 캐시하지 않음
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    request.method !== "GET"
  ) {
    return;
  }

  // 정적 자산 (JS, CSS, 이미지, 폰트): Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML 네비게이션 요청: SW가 캐시하지 않고 네트워크로 직접 전달
  // SSR 페이지를 SW가 캐시하면 hydration mismatch → 무한 리로드 발생
  if (request.mode === "navigate") {
    return;
  }

  // 기타 GET 요청: Network First
  event.respondWith(networkFirst(request));
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|avif|ico)$/)
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
