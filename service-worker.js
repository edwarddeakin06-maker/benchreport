const CACHE = "benchreport-0.4.10";
const CORE = ["./", "./index.html", "./styles.css?v=0.4.3", "./product.css", "./src/app.js?v=0.4.1", "./src/touchstone.js", "./manifest.webmanifest", "./assets/benchreport-icon.svg", "./assets/benchreport-workflow.png", "./samples/filter-golden.s2p", "./samples/filter-unit-017.s2p", "./samples/filter-unit-042-fail.s2p", "./guide/", "./formats/", "./privacy/", "./support/", "./pro/", "./buy/", "./tools/touchstone-viewer/", "./tools/compare-s2p-files/", "./tools/vna-report-generator/", "./offline.html"];

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match("./offline.html"))));
});
