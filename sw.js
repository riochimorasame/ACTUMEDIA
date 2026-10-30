/* Capture Média — service worker : site utilisable plus vite et même hors connexion.
   Pages/JS : réseau d'abord (on voit toujours les nouvelles vidéos), cache en secours.
   Images/CSS : cache d'abord, mis à jour en arrière-plan. */
const CACHE = "capture-media-v1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "videos.js", "logo.png", "manifest.webmanifest", "assets/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // YouTube, polices… : jamais interceptés
  const fresh = req.mode === "navigate" || /\.(js|html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (fresh) {
    e.respondWith(
      Promise.race([fetch(req), new Promise((_, rej) => setTimeout(rej, 5000))])
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
