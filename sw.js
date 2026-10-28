// Gör att appen startar direkt från cachen, även med dålig täckning på gymmet.
// Alla filer sparas när en ny version installeras och används sedan därifrån.
// CACHE innehåller en kontrollsumma av filerna: kör tools/sw-version.py efter ändringar
// (testerna larmar om den inte stämmer). En ny summa gör att webbläsaren installerar om.
const CACHE = "driv-0bf8a96c";
const FILES = ["index.html", "app.js", "figur.js", "ikoner.js", "fokus.js", "trana.js", "start.js", "kost.js", "historik.js", "social.js", "notiser.js", "aktivitet.js", "vila.js", "skanner.js", "ovningar.js", "livsmedel.js", "mat.js", "produkter.js", "produkter.json", "config.js", "konto.js",
  "manifest.webmanifest", "manifest-test.webmanifest", "icons/favicon-v2.png", "icons/apple-touch-icon-v2.png", "icons/icon-192-v2.png", "icons/icon-512-v2.png", "icons/icon-maskable-512-v2.png", "fonts/unbounded-300.woff2", "fonts/unbounded-600.woff2", "fonts/lexend-300.woff2", "fonts/lexend-400.woff2", "fonts/lexend-500.woff2", "fonts/lexend-600.woff2"];

self.addEventListener("install", e => {
  // Alla filer måste komma från samma version. cache: "reload" hoppar över webbläsarens cache, och versionen
  // i adressen gör att GitHub Pages cdn inte kan svara med en gammal kopia (den sparar sidor i upp till 10 minuter).
  // Filerna sparas under sina vanliga namn.
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => fetch(new Request(`${f}?v=${CACHE}`, { cache: "reload" }))
      .then(r => { if (!r.ok) throw new Error(`${f}: ${r.status}`); return c.put(f, r); }))))
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

// Notiser från servern (supabase/functions/driv-push). Ett tryck öppnar appen.
self.addEventListener("push", e => {
  let msg = {};
  try { msg = e.data ? e.data.json() : {}; } catch (err) { msg = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(msg.title || "Driv", {
    body: msg.body || "", icon: "icons/icon-192-v2.png", badge: "icons/favicon-v2.png", data: { url: msg.url || "./" },
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const open = list.find(c => "focus" in c);
    return open ? open.focus() : self.clients.openWindow(e.notification.data.url || "./");
  }));
});
