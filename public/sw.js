// Fallback Service Worker (overwritten by VitePWA in production builds).
// Immediately clears legacy 'driptech-v1' caches and passes requests straight to the network
// so users never get stuck on stale HTML after deployments.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith('driptech-v') || key.startsWith('workbox-'))
            .map((key) => caches.delete(key)),
        );
      }
      await self.clients.claim();
    })(),
  );
});
