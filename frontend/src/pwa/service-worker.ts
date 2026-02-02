/// <reference lib="webworker" />

import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: any[];

// 📦 Precache build assets
precacheAndRoute(__WB_MANIFEST);

// 🌐 API – Network First
registerRoute(
  ({ url }) => url.pathname.startsWith("/api"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60,
      }),
    ],
  })
);

// 🎨 Static assets
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style",
  new CacheFirst({
    cacheName: "static-assets",
  })
);

// 🖼 Images
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [new ExpirationPlugin({ maxEntries: 100 })],
  })
);

// 🔁 Mise à jour contrôlée depuis l’UI
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
