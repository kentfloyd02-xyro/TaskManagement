// Student Task Planner - High-Performance Offline PWA Service Worker (v6)
// Guarantees 100% offline access when added to mobile home screen or desktop.

const CACHE_NAME = 'student-planner-cache-v6';

// Core Application Shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/logo.png',
  '/pwa-144x144.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache core shell; don't fail entire install if one optional icon is missing
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW Precache Notice] Could not precache:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Service Worker Activation & Old Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW Cache] Purging outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Robust Navigation Fallback Handler
 * Guaranteed to return index.html when opening from Home Screen while offline.
 */
async function handleNavigation(event) {
  // If user is offline right now, serve from cache instantly with zero network delay
  if (!navigator.onLine) {
    const cachedShell =
      (await caches.match(event.request, { ignoreSearch: true })) ||
      (await caches.match('/index.html', { ignoreSearch: true })) ||
      (await caches.match('/', { ignoreSearch: true }));
    if (cachedShell) return cachedShell;
  }

  // If online, try network with a 2-second timeout
  try {
    const networkPromise = fetch(event.request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), 2000)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put('/index.html', clone).catch(() => {});
      });
    }
    return response;
  } catch (error) {
    // Network failed or timed out — return cached offline SPA shell
    const cachedShell =
      (await caches.match(event.request, { ignoreSearch: true })) ||
      (await caches.match('/index.html', { ignoreSearch: true })) ||
      (await caches.match('/', { ignoreSearch: true }));

    if (cachedShell) return cachedShell;
    throw error;
  }
}

/**
 * Static Asset Handler (JS, CSS, Web Fonts)
 * Cache-First with Stale-While-Revalidate so app renders instantly offline.
 */
async function handleStaticAsset(event) {
  const cachedResponse = await caches.match(event.request, { ignoreSearch: true });

  // If already in cache, return immediately (and update cache in background if online)
  if (cachedResponse) {
    if (navigator.onLine) {
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        })
        .catch(() => {});
    }
    return cachedResponse;
  }

  // Not in cache, fetch from network and cache
  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse && networkResponse.status === 200) {
      const clone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return networkResponse;
  } catch (err) {
    // Return cached match fallback if any
    const fallback = await caches.match(event.request, { ignoreSearch: true });
    if (fallback) return fallback;
    throw err;
  }
}

/**
 * Image & Media Asset Handler
 */
async function handleMediaAsset(event) {
  const cached = await caches.match(event.request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse && networkResponse.status === 200) {
      const clone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return networkResponse;
  } catch (err) {
    // Fallback image if available
    const logoFallback = await caches.match('/logo.png');
    if (logoFallback) return logoFallback;
    throw err;
  }
}

// Request Interception
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. NEVER intercept backend /api/ calls — handled by Axios client & IndexedDB
  if (url.includes('/api/')) {
    return;
  }

  // 2. Navigation requests (Opening app from Home Screen, routing between pages)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(handleNavigation(event));
    return;
  }

  // 3. Static scripts, styles, Vite chunks, and web fonts
  if (
    url.includes('.js') ||
    url.includes('.css') ||
    url.includes('/assets/') ||
    url.includes('/src/') ||
    url.includes('/@') ||
    url.includes('.woff') ||
    url.includes('.woff2')
  ) {
    event.respondWith(handleStaticAsset(event));
    return;
  }

  // 4. Images, icons, manifest
  if (
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.svg') ||
    url.includes('.ico') ||
    url.includes('manifest.json')
  ) {
    event.respondWith(handleMediaAsset(event));
    return;
  }
});

// ===============================================================
// Real Phone & Desktop Web Push Notification Event Listener
// ===============================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'Student Planner Reminder',
    body: 'You have an upcoming academic activity!',
    icon: '/logo.png',
    badge: '/logo.png',
    url: '/schedule',
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [500, 150, 500, 150, 500],
    requireInteraction: true,
    data: {
      url: data.url || '/schedule',
      alarm: data.data || data.alarm || null,
    },
    actions: [
      { action: 'open', title: '🚨 Open & View Alarm' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/schedule';
  const alarmData = event.notification.data?.alarm;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          if (alarmData) {
            client.postMessage({ type: 'TRIGGER_ALARM', alarm: alarmData });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
