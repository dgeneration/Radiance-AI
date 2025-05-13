/**
 * Custom service worker for Radiance AI PWA
 * This file will be used by next-pwa to customize the service worker behavior
 */

// Import workbox
self.importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Configure workbox
workbox.setConfig({
  debug: false
});

// This will be replaced by the precache manifest
self.__WB_MANIFEST;

// Explicitly precache the offline page
workbox.precaching.precacheAndRoute([
  { url: '/offline', revision: null },
  { url: '/icons/icon-512x512.png', revision: null }
]);

// Cache first strategy for static assets
workbox.routing.registerRoute(
  /\/_next\/static\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Network first strategy for API routes
workbox.routing.registerRoute(
  /\/api\/.*/i,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 10 * 60 // 10 minutes
      })
    ]
  })
);

// Stale while revalidate for pages
workbox.routing.registerRoute(
  /\/(?!api\/|_next\/|icons\/|images\/|favicon\.ico).*/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ],
    networkTimeoutSeconds: 10 // Show cached content if network request takes more than 10 seconds
  })
);

// Cache images
workbox.routing.registerRoute(
  /\/icons\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'icon-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Offline fallback
workbox.routing.setCatchHandler(async ({ event }) => {
  // Return specific fallbacks for different types of requests
  const destination = event.request.destination;

  if (destination === 'document') {
    try {
      // Try to serve the offline page from the cache
      const offlinePageResponse = await workbox.precaching.matchPrecache('/offline');
      if (offlinePageResponse) {
        return offlinePageResponse;
      }

      // If the offline page is not in the cache, try to fetch it from the network
      return await fetch('/offline');
    } catch (error) {
      // If all else fails, return a simple offline message
      return new Response('You are offline. Please check your internet connection.', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  if (destination === 'image') {
    try {
      return await workbox.precaching.matchPrecache('/icons/icon-512x512.png');
    } catch (error) {
      // Return a transparent image as fallback
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    }
  }

  // For all other types of requests, return an error response
  return Response.error();
});

// Skip waiting and claim clients
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
