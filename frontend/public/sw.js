const CACHE_NAME = 'student-planner-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/logo.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never intercept API requests with service worker cache, let axios handle them
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first for HTML, JS, and CSS so code updates apply instantly
  if (
    event.request.mode === 'navigate' ||
    event.request.url.includes('.js') ||
    event.request.url.includes('.css') ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('/@')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
    return;
  }

  // Cache-first for images and icons
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Real Phone & Desktop Web Push Notification Event Listener
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

// Click listener to bring phone user directly to planner page and trigger in-app siren
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

