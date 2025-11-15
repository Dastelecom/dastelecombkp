// Name and version for your cache
const CACHE_NAME = 'invoice-generator-cache-v1';

// List of files to cache (from your folder)
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/add-products.html',
  '/analysis.html',
  '/download-software.html',
  '/invoice.html',
  '/invoice-no-emi.html',
  '/invoice-pdfs.html',
  '/main.html',
  '/product-list.html',
  '/select-invoice.html',
  '/server-status.html',
  '/test.html',
  '/test-firebase.html',
  '/icon.png',
  '/invoice-icon.png',
  '/security-icon.jpg',
  '/security-Qr_code.jpg',
  '/TVS Credit.png',
  '/color_terminal.png',
  '/hover.html',
  '/manifest.json'
];

// Install service worker and cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Serve cached files if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached file or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => caches.match('/index.html'))
      );
    })
  );
});

