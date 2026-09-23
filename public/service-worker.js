const SNAPSHOT = 'eecf89515998e0cf';
const SHELL_CACHE = `nomm-shell-v1-${SNAPSHOT}`;
const CONTENT_CACHE = `nomm-content-${SNAPSHOT}`;
const ASSET_CACHE = `nomm-assets-v1-${SNAPSHOT}`;
const OWN_CACHE_PREFIXES = ['nomm-shell-', 'nomm-content-', 'nomm-assets-'];

const SHELL_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './agent-manifest.json',
  './assets/css/styles.css',
  './assets/brand/app-icon.svg',
  './src/ui/app.mjs',
  './src/domain/cards.mjs',
  './src/domain/discovery.mjs',
  './src/domain/korean-daily.mjs',
  './src/local/state.mjs',
  './src/agent/webmcp-adapter.mjs'
];
const CARD_URLS = ["./data/cards/C0001.json","./data/cards/C0002.json","./data/cards/C0003.json","./data/cards/C0004.json","./data/cards/C0005.json"];
const CONTENT_URLS = [
  './data/manifest.json',
  './data/cards-index.json',
  './data/references.json',
  './data/assets.json',
  './data/relations.json',
  ...CARD_URLS
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const content = await caches.open(CONTENT_CACHE);
    await shell.addAll(SHELL_URLS);
    await content.addAll(CONTENT_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, CONTENT_CACHE, ASSET_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => OWN_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) && !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function navigationResponse(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('./index.html')) || (await caches.match('./offline.html'));
  }
}
async function immutableSnapshotResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CONTENT_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
async function assetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSET_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Offline asset unavailable' });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') { event.respondWith(navigationResponse(event.request)); return; }
  if (url.pathname.includes('/data/')) { event.respondWith(immutableSnapshotResponse(event.request)); return; }
  if (url.pathname.includes('/assets/')) event.respondWith(assetResponse(event.request));
});
