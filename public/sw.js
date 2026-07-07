self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith("productfindai-")).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  // Intentionally no-op. ProductFindAI avoids browser-level page caching so
  // official Amazon product content cannot be retained past its freshness rule.
});
