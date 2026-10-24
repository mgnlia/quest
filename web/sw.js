/* Quest Demo service worker: precache the whole app so it opens offline and installs as an app. */
'use strict';
const VERSION = 'quest-demo-v1.0.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/core.js', './js/data.js', './js/user.js', './js/user2.js', './js/admin.js', './js/boot.js',
  './fonts/PretendardVariable.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Network first for the app shell (so a new deploy shows up on the next load), cache as fallback offline.
   Cache first for fonts and icons, which never change within a version. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  if (url.pathname === '/healthz') return;
  const staticAsset = /\/(fonts|icons)\//.test(url.pathname);
  if (staticAsset){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
