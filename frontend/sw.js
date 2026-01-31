// Service Worker for Expense Tracker PWA
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `expense-tracker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `expense-tracker-dynamic-${CACHE_VERSION}`;

// All assets to cache - now all local for reliable offline support
const LOCAL_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/offline-db.js',
    '/sync.js',
    '/manifest.json',
    '/lib/chart.min.js',
    '/lib/flatpickr.min.js',
    '/lib/flatpickr.min.css',
    '/icons/icon-192.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v3...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(async (cache) => {
                console.log('[SW] Caching all local assets');
                await cache.addAll(LOCAL_ASSETS);
                console.log('[SW] All assets cached successfully');
            })
            .then(() => self.skipWaiting())
            .catch((err) => console.error('[SW] Cache install failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                        .map((key) => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API requests - network first, then cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // All other requests - cache first, then network
    event.respondWith(cacheFirst(request));
});

// Cache first strategy (for static assets)
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Fetch failed, returning offline page');
        // Return cached index.html for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        // Return empty response for other failed requests
        return new Response('', { status: 503, statusText: 'Offline' });
    }
}

// Network first strategy (for API requests)
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache');
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        // Return empty response for failed API calls (app will use IndexedDB)
        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Background sync for pending operations
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    if (event.tag === 'sync-expenses') {
        event.waitUntil(syncPendingData());
    }
});

// Sync pending data when back online
async function syncPendingData() {
    // This will be handled by the sync.js module
    // Notify all clients to sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_REQUIRED' });
    });
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
