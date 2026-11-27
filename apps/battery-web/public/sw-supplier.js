// Keep this URL available for browsers that still have the old root-scoped worker.
// The replacement leaves all requests to the browser's normal network handling.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await caches.delete("supplier-portal-v1");
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "supplier-cache-status") {
    event.ports[0]?.postMessage("supplier-cache-retired");
  }
});
