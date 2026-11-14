const CACHE = "loopyduck-v0.5.5";
const ASSETS = ["./", "index.html", "vendor/three.min.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    // The page itself: newest version when online, cached copy when offline.
    e.respondWith(
      fetch(r)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
          return res;
        })
        .catch(() => caches.match(r).then(hit => hit || caches.match("index.html")))
    );
    return;
  }
  // Everything else (three.js, icons): cached first, refreshed in the background.
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
