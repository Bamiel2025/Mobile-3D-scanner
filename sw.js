// sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // event.waitUntil(caches.open('v1').then(cache => {
  //   return cache.addAll([
  //     '/',
  //     '/index.html',
  //     // Add other static assets here if needed for basic offline functionality
  //   ]);
  // }));
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // event.waitUntil(clients.claim()); // Take control of open clients
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching', event.request.url);
  // Basic pass-through fetch handler
  event.respondWith(fetch(event.request));
});
