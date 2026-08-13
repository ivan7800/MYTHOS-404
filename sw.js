'use strict';

const VERSION = '9.1.0';
const CACHE_PREFIX = 'mythos-404-knowledge-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_PAGE = './index.html';
const CORE = [
  './',
  './index.html',
  './css/styles.css',
  './js/core.js',
  './js/index.js',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-192.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response?.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) || (await cache.match(OFFLINE_PAGE)) || Response.error();
      }
    })());
    return;
  }

  // Static shell, progressive search shards and culture chunks use stale-while-revalidate.
  // Shards/chunks become available offline after they have been requested at least once.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then(async response => {
        if (response?.ok && response.type === 'basic') {
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);
    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    return (await network) || Response.error();
  })());
});
