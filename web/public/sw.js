/* Service worker — an toàn & gọn: tăng tốc tải lại + trang "mất mạng" thân thiện.
   KHÔNG lưu trang HTML (tránh lộ thông tin tài khoản trên máy dùng chung), KHÔNG đụng /api, /admin. */
const VERSION = "qp-v1";
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE_URL])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/di/")) return;

  // Mở trang: lấy từ mạng; mất mạng → trang "ngoại tuyến".
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Tệp tĩnh (JS/CSS hash, font, ảnh): lấy từ bộ nhớ đệm trước, cập nhật ngầm.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/img/") || /\.(?:woff2?|png|jpe?g|webp|svg|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
