const CACHE_NAME = 'music-pwa-v6';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './192.png',
  './512.png'
];

// Instalación: cachea los archivos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Activa el nuevo worker inmediatamente
});

// Activación: limpia cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // Toma control de las páginas abiertas
});

// Fetch: primero intenta con caché, luego red, y actualiza en segundo plano
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Devuelve del caché y actualiza en segundo plano
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback offline: si es una navegación, muestra index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Sin conexión', { status: 503 });
      });
    })
  );
});