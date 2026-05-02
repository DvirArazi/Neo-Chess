self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
      self.clients.matchAll({ type: "window" }).then((clients) =>
        Promise.all(clients.map((client) => client.navigate(client.url)))
      ),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
