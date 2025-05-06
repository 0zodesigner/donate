// sw.js

const CACHE_NAME = 'donation-page-cache-v1'; // Change version to force update
const urlsToCache = [
    '/', // Cache the root/index page if this IS the index page
    'index.html', // Or whatever your HTML file is named
    'style.css',
    'script.js',
    'manifest.json',
    // Add essential images that should always be available
    'icon-01.png',
    '192.png',
    'qr.PNG',
    'aba.PNG',
    'acleda.PNG',
    'telegram.png',
    'Thank.gif' // Consider optimizing/replacing this GIF!
    // Add other essential icons/images if any
];

// --- Installation: Cache core assets ---
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] Core assets cached successfully');
                return self.skipWaiting(); // Activate SW immediately
            })
            .catch(error => {
                console.error('[SW] Failed to cache core assets:', error);
            })
    );
});

// --- Activation: Clean up old caches ---
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim(); // Take control of open pages
        })
    );
});

// --- Fetch: Serve from Cache first, then Network ---
self.addEventListener('fetch', event => {
    // console.log('[SW] Fetch event for:', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    // console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }

                // Not in cache - fetch from network
                // console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // Optional: Cache the new response dynamically?
                        // Be careful with this for non-static assets or API calls
                        // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                        //     caches.open(CACHE_NAME).then(cache => {
                        //         cache.put(event.request, networkResponse.clone());
                        //     });
                        // }
                        return networkResponse;
                    }
                ).catch(error => {
                     console.error('[SW] Fetch failed for:', event.request.url, error);
                     // Optional: Return a fallback offline page if fetch fails
                     // return caches.match('/offline.html');
                });
            })
    );
});
