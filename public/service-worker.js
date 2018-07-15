// This is a service worker for making the app progressive and enabling caching

var cacheName = 'treatDispenser-1';
var filesToCache = [];

// Install the worker
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

// Activate the worker
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Cache all the assets that don't change much
var filesToCache = [
    '/',
    '/index.html',
    '/android-icon-36x36.png',
    '/android-icon-48x48.png',
    '/android-icon-72x72.png',
    '/android-icon-96x96.png',
    '/android-icon-144x144.png',
    '/android-icon-192x192.png',
    '/apple-icon.png',
    '/apple-icon-57x57.png',
    '/apple-icon-60x60.png',
    '/apple-icon-72x72.png',
    '/apple-icon-76x76.png',
    '/apple-icon-114x114.png',
    '/apple-icon-120x120.png',
    '/apple-icon-144x144.png',
    '/apple-icon-152x152.png',
    '/apple-icon-180x180.png',
    '/apple-icon-precomposed.png',
    '/favicon.ico',
    'ms-icon-70x70',
    'ms-icon-144x144',
    'ms-icon-150x150',
    'ms-icon-310x310',
    '/assets/js/app.js',
    '/assets/js/hammer.js',
    '/assets/js/jquery.js',
    '/assets/js/moment.js',
    '/assets/scss/_settings.scss',
    '/assets/scss/app.scss',
    '/templates/debug.html',
    '/templates/home.html',
    '/templates/settings.html'
];

// Fetch all the cached assets
self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});