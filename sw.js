// Gör att appen startar direkt från cachen, även med dålig täckning på gymmet.
// Alla filer sparas när en ny version installeras och används sedan därifrån.
// CACHE innehåller en kontrollsumma av filerna: kör tools/sw-version.py efter ändringar
// (testerna larmar om den inte stämmer). En ny summa gör att webbläsaren installerar om.
const CACHE = "driv-7897c9d5";
const FILES = ["index.html", "app.js", "figur.js", "fokus.js", "kost.js", "historik.js", "ovningar.js", "livsmedel.js", "mat.js", "config.js",
  "manifest.webmanifest", "icons/favicon.png", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" hoppar över webbläsarens vanliga cache så att alla filer kommer från samma version
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const key = e.request.mode === "navigate" ? "index.html" : e.request;
  e.respondWith(caches.match(key, { ignoreSearch: true, cacheName: CACHE })
    .then(hit => hit || fetch(e.request))
    .catch(() => caches.match("index.html")));
});
