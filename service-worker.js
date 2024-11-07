// const CACHE_NAME = "stroop-test-cache-v1";
// const urlsToCache = [
//   "/",
//   "/main.html",
//   "/assets/manifest.json",
//   "/mozgani.js",
// ];

// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => cache.addAll(urlsToCache))
//   );
// });

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => response || fetch(event.request))
//   );
// });

// self.addEventListener('activate', event => {
//   const cacheWhitelist = [CACHE_NAME];
//   event.waitUntil(
//     caches.keys().then(keyList =>
//       Promise.all(
//         keyList.map(key => {
//           if (!cacheWhitelist.includes(key)) {
//             return caches.delete(key);
//           }
//         })
//       )
//     )
//   );
// });

const CACHE_NAME = `stroop-test-cache-v1`;

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
      '/',
      '/main.html',
      'mozgani.js',
      'assets/icon512.png'
    ]);
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Get the resource from the cache.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    } else {
        try {
          // If the resource was not in the cache, try the network.
          const fetchResponse = await fetch(event.request);

          // Save the resource in the cache and return it.
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        } catch (e) {
          // The network failed.
        }
    }
  })());
});