// sw.js - Basic Service Worker for PWA installation prompt

const VERSION = 'v1'; // Simple versioning for potential cache updates later

/**
 * Installation Phase
 * Fired when the service worker is first installed or updated.
 */
self.addEventListener('install', (event) => {
  console.log(`Service Worker (${VERSION}): Installing...`);
  // Force the waiting service worker to become the active service worker.
  // This helps updates apply faster, especially when paired with clients.claim().
  self.skipWaiting();
  // Note: No caching is done here in this basic setup.
});

/**
 * Activation Phase
 * Fired after installation and when the service worker takes control.
 */
self.addEventListener('activate', (event) => {
  console.log(`Service Worker (${VERSION}): Activating...`);
  // Take control of all open clients (tabs/windows) immediately.
  // Necessary for the effects of skipWaiting() to be seen by existing pages
  // without requiring a reload.
  event.waitUntil(self.clients.claim());
  // Note: No cache cleanup is done here in this basic setup.
});

/**
 * Fetch Phase
 * Fired for every network request made by pages controlled by the service worker.
 * This basic version simply acts as a pass-through.
 */
self.addEventListener('fetch', (event) => {
  // Optional: Log the fetch request for debugging
  // console.log(`Service Worker (${VERSION}): Fetching `, event.request.url);

  // Basic network pass-through strategy.
  // The browser will handle the request as if the service worker wasn't there.
  // If the network fails, the request will fail (no offline fallback).
  event.respondWith(fetch(event.request));
});
